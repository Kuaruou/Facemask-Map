<template>
  <div class="index row no-gutters">
    <div v-if="cityName.length" class="col-sm-3">
      <div class="toolbox">
        <div class="sticky-top bg-white shadow-sm p-2">
          <div class="form-group d-flex">
            <label for="cityName" class="mr-2 col-form-label text-right">縣市</label>
            <div class="flex-fill">
              <select
                class="form-control"
                id="cityName"
                v-model="select.city"
                @change="select.area = ''"
              >
                <option value="">-- 請選擇城市 --</option>
                <option :value="c.CityName" v-for="c in cityName" :key="c.CityName">
                  {{ c.CityName }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group d-flex">
            <label for="area" class="mr-2 col-form-label text-right">地區</label>
            <div class="flex-fill">
              <select
                id="area"
                class="form-control"
                v-if="select.city.length"
                v-model="select.area"
                @change="updateSelect"
              > 
                <option value="">-- 請選擇地區 --</option>
                <option :value="a.AreaName"
                  v-for="a in cityName.find((city) => city.CityName === select.city).AreaList"
                  :key="a.AreaName">
                  {{ a.AreaName }}
                </option>
              </select>
            </div>
          </div>
          <p class="mb-0 small text-muted text-center">請先選擇區域查看(綠色代表還有存貨)</p>
        </div>

        <ul class="list-group">
          <template v-for="(item, key) in data">
            <a
              class="list-group-item text-left"
              :key="key"
              v-if="item.properties.county === select.city
            && item.properties.town === select.area"
              :class="{ 'highlight': item.properties.mask_adult || item.properties.mask_child }"
              @click="penTo(item)"
            >
              <h5>{{ item.properties.name }}</h5>
              <p class="mb-0">成人口罩:{{ item.properties.mask_adult }} | 兒童口罩:{{ item.properties.mask_child }}</p>
              <p class="mb-0">
                地址:
                <a :href="`https://www.google.com.tw/maps/place/${item.properties.address}`"
                  target="_blank"
                  title="Google Map"
                >{{ item.properties.address }}
                </a>
              </p>
            </a>
          </template>
        </ul>
      </div>
    </div>
    <div class="col-sm-9">
      <div id="map"></div>
    </div>
  </div>
</template>

<script>
import L from "leaflet";
import cityName from "./assets/cityName";

let osmMap = {};

const iconsConfig = {
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
};

const icons = {
  green: new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    ...iconsConfig,
  }),
  grey: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    ...iconsConfig,
  }),
};

const osm = {
  addMapMarker(x, y, item) {
    const icon = item.mask_adult || item.mask_child ? icons.green : icons.grey;
    L.marker([y, x], {
      icon,
    }).addTo(osmMap).bindPopup(//使用bindPopup在marker上加上註釋
    `<h5>${item.name}</h5><br>
    <button class="btn-adult">成人 - ${item.mask_adult ? `${item.mask_adult} 個` : '未取得資料'} </button><button class="btn-child">兒童 - ${item.mask_child ? `${item.mask_child}個`: '未取得資料'}</button><br>
    地址: <a href="https://www.google.com.tw/maps/place/${item.address}" target="_blank">${item.address}</a><br>
    電話: ${item.phone}<br>
    <small>最後更新時間: ${item.updated}</small>`);
  },
  removeMarker() {//在點選下一個地區時移除上一個地區的圖層，避免之前的marker累積
    osmMap.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        osmMap.removeLayer(layer);
      }
    });
  },
  penTo(x, y, item) {
    const icon = item.mask_adult || item.mask_child ? icons.green : icons.grey;
    osmMap.flyTo(new L.LatLng(y, x));//在地圖移動時以滑動的動畫進入中心
    L.marker([y, x], {
      icon,
    }).addTo(osmMap).bindPopup(`<h5>${item.name}</h5><br>
    <button class="btn-adult">成人 - ${item.mask_adult ? `${item.mask_adult} 個` : '未取得資料'} </button><button class="btn-child">兒童 - ${item.mask_child ? `${item.mask_child}個`: '未取得資料'}</button><br>
    地址: <a href="https://www.google.com.tw/maps/place/${item.address}" target="_blank">${item.address}</a><br>
    電話: ${item.phone}<br>
    <small>最後更新時間: ${item.updated}</small>`).openPopup();
  },  
};

export default {
  name: "index",
  data: () => ({
    cityName,//使用import載入json格式的方式撈取資料
    data: {},
    osmMap: {},
    select: {//預設畫面地區
      city: "臺北市",
      area: "大安區"
    },
  }),
  methods: {
    updateMarker() {
      const pharmacies = this.data.filter((pharmacy) => {
        if (!this.select.area) {
          return pharmacy.properties.county === this.select.city;
        }
        return pharmacy.properties.town === this.select.area;
      });
      pharmacies.forEach((pharmacy) => {
        const { properties, geometry } = pharmacy;
        osm.addMapMarker(
          geometry.coordinates[0],//座標1
          geometry.coordinates[1],//座標2
          properties,
        );
      });
      this.penTo(pharmacies[0]);
    },
    removeMarker() {
      osm.removeMarker();
    },
    penTo(pharmacy) {
      const { properties, geometry } = pharmacy;
      osm.penTo(geometry.coordinates[0], geometry.coordinates[1], properties);
    },
    updateSelect() {
      this.removeMarker();
      this.updateMarker();
      const pharmacy = this.data.find(item => item.properties.town === this.select.area);
      const {geometry, properties } = pharmacy;
      osm.penTo(geometry.coordinates[0], geometry.coordinates[1], properties);
    },
  },
  created() {
    this.$http.get(//使用axios撈取遠端的診所資料
      'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json')
      .then((res) => {
        this.data = res.data.features;
        this.updateMarker();
      })
  },
  mounted() {
    //OSM
    osmMap = L.map("map", {
      center: [25.04, 121.53],
      zoom: 16
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '<a target="_blank" href="https://www.openstreetmap.org/">OSM</a>',
      maxZoom: 18
    }).addTo(osmMap);
  }
};
</script>

<style lang="scss">
@import "bootstrap/scss/bootstrap";

#map {
  height: 100vh;
}

.index {
  position: relative;
}

.highlight {
  background: #A5DEE4;
}

.toolbox {
  height: 100vh;
  overflow-y: auto;
  a {
    cursor: pointer;
  }
}

.btn-adult {
  color: #fff;
  background-color: #986DB2;
  border-color: #986DB2;
}

.btn-child {
  color: #fff;
  background-color: #78C2C4;
  border-color: #78C2C4;
}
</style>
