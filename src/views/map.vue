<template>
  <div id="mapid"></div>
</template>

<style lang="scss" scoped>
  #mapid { height: 180px; }
</style>

<script>

var mymap = L.map('mapid').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '<a href="https://www.openstreetmap.org/">OSM</a>',
	maxZoom: 18,
}).addTo(mymap);

</script>


