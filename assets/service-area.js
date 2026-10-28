/* GONZA service-area map. City reference points: U.S. Census 2025 Gazetteer.
   Leaflet is loaded on demand; tiles are requested only for the visible map. */
(() => {
  const mapElement = document.getElementById('serviceMap');
  if (!mapElement) return;
  let map, points, bounds, initialization;
  const sprayIcon = '<svg class="coverage-spray" viewBox="0 0 36 44" fill="none" aria-hidden="true" focusable="false"><path class="spray-body" d="M13 17h9c0 7 6 9 6 18 0 4-2 7-6 7H10c-5 0-6-3-5-7l3-10c1-3 4-5 5-8Z" fill="#06335B" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 31c8 0 11-6 18-5l2 8c-7-3-13 6-22 4Z" fill="#12B9E7"/><path d="m13 17 1-6 7-1 1 7Z" fill="#12B9E7" stroke="#FFFFFF" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 5h15l6 4-1 5-9-1-5 4-4-3 4-5H8Z" fill="#06335B" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/><path d="m22 14-2 6" stroke="#06335B" stroke-width="2.6" stroke-linecap="round"/><path d="m10 27 2-4" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round"/><circle cx="31" cy="4" r="1.6" fill="#12B9E7"/><circle cx="33" cy="9" r="1.3" fill="#12B9E7"/><circle cx="28" cy="1.8" r="1.2" fill="#12B9E7"/></svg>';
  document.querySelector('.coverage-key i')?.insertAdjacentHTML('afterbegin', sprayIcon);
  const guideIcon = document.querySelector('.map-guide-icon');
  if (guideIcon) guideIcon.innerHTML = sprayIcon;
  const buttons = [...document.querySelectorAll('[data-map-city]')];
  const status = document.getElementById('coverageStatus');
  function selectCity(name, focus = true) {
    if (!points) return;
    const point = points.find(item => item.name === name);
    if (!point) return;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapCity === name)));
    points.forEach(item => item.marker.getElement()?.classList.toggle('is-selected', item === point));
    status.textContent = name + ', NC — include your ZIP code so we can confirm your address.';
    if (focus) map.setView([point.lat, point.lng], 11, {animate: false});
    point.marker.openPopup();
  }
  function resetMap() {
    if (!map) return;
    map.closePopup();
    map.fitBounds(bounds, {padding: [42, 42], animate: false});
    buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    points.forEach(item => item.marker.getElement()?.classList.remove('is-selected'));
    status.textContent = 'Explore our 16 service communities. Select a city to take a closer look.';
  }
  async function initialize() {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        const [cities] = await Promise.all([
          fetch('assets/service-cities.json').then(response => {
            if (!response.ok) throw new Error('City data unavailable');
            return response.json();
          }),
          new Promise((resolve, reject) => {
            const stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet'; stylesheet.href = 'assets/leaflet.css';
            const styleReady = new Promise((loaded, failed) => {stylesheet.onload = loaded; stylesheet.onerror = failed;});
            document.head.append(stylesheet);
            const scriptReady = window.L ? Promise.resolve() : new Promise((loaded, failed) => {
              const script = document.createElement('script');
              script.src = 'assets/leaflet.js'; script.onload = loaded; script.onerror = failed;
              document.head.append(script);
            });
            Promise.all([styleReady, scriptReady]).then(resolve, reject);
          })
        ]);
        mapElement.replaceChildren();
        map = L.map(mapElement, {scrollWheelZoom: false, zoomControl: false, minZoom: 7, maxZoom: 16});
        L.control.zoom({position: 'bottomright'}).addTo(map);
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);
        let loadedTiles = 0, failedTiles = 0;
        tiles.on('tileload', () => {loadedTiles++; document.getElementById('mapTileNote').hidden = true;});
        tiles.on('tileerror', () => {failedTiles++; if (!loadedTiles && failedTiles > 3) document.getElementById('mapTileNote').hidden = false;});
        const directions = {
          'Raleigh': 'right', 'Durham': 'top', 'Chapel Hill': 'left', 'Cary': 'right',
          'Apex': 'left', 'Morrisville': 'top', 'Holly Springs': 'left', 'Garner': 'right',
          'Clayton': 'top', 'Smithfield': 'bottom', 'Selma': 'right', 'Fuquay-Varina': 'bottom',
          'Wake Forest': 'top', 'Knightdale': 'top', 'Wendell': 'bottom', 'Zebulon': 'top'
        };
        const outerLabels = new Set(['Raleigh','Durham','Chapel Hill']);
        points = cities.map(city => {
          const marker = L.marker([city.lat, city.lng], {
            title: city.name + ', North Carolina', alt: city.name + ' service community',
            icon: L.divIcon({className: 'coverage-marker', html: sprayIcon, iconSize: [30,38], iconAnchor: [15,36], tooltipAnchor: [0,-24], popupAnchor: [0,-27]})
          }).addTo(map);
          marker.bindTooltip(city.name, {permanent: outerLabels.has(city.name), direction: directions[city.name], offset: [0,0], className: 'coverage-label' + (outerLabels.has(city.name) ? '' : ' coverage-label-minor')});
          const popup = document.createElement('div'); popup.className = 'coverage-popup';
          const title = document.createElement('strong'); title.textContent = city.name + ', NC';
          const description = document.createElement('p'); description.textContent = 'Residential & commercial cleaning. Share your ZIP code to confirm availability.';
          const link = document.createElement('a'); link.href = '#estimate'; link.className = 'coverage-quote';
          link.dataset.mapQuoteCity = city.name; link.textContent = 'Get a free estimate →';
          link.addEventListener('click', () => {document.getElementById('serviceCity').value = city.name;});
          popup.append(title, description, link);
          marker.bindPopup(popup, {maxWidth: 245, autoPanPaddingTopLeft: [20,30], autoPanPaddingBottomRight: [20,30]});
          marker.on('click', () => selectCity(city.name, false));
          return {...city, marker};
        });
        bounds = L.latLngBounds(points.map(point => [point.lat, point.lng]));
        function updateMapDetail() {
          mapElement.classList.toggle('coverage-wide-labels', map.getZoom() >= 11);
          mapElement.classList.toggle('coverage-detail-map', map.getZoom() >= 11);
        }
        map.on('zoomend', updateMapDetail);
        resetMap();
        updateMapDetail();
        mapElement.setAttribute('aria-busy','false');
        if (window.ResizeObserver) new ResizeObserver(() => map.invalidateSize()).observe(mapElement);
      } catch (error) {
        mapElement.innerHTML = '<iframe loading="lazy" title="Raleigh region on Google Maps" referrerpolicy="strict-origin-when-cross-origin" src="https://www.google.com/maps?q=Raleigh%20North%20Carolina&amp;z=9&amp;output=embed"></iframe>';
        mapElement.setAttribute('aria-busy','false');
        status.textContent = 'Use our city list to check the communities we serve, then share your ZIP code with your estimate request.';
      }
    })();
    return initialization;
  }
  buttons.forEach(button => button.addEventListener('click', async () => {
    await initialize();
    if (map) selectCity(button.dataset.mapCity);
  }));
  document.getElementById('showAllCities')?.addEventListener('click', async () => {await initialize(); resetMap();});
  mapElement.addEventListener('click', event => {
    const link = event.target.closest('[data-map-quote-city]');
    if (link) document.getElementById('serviceCity').value = link.dataset.mapQuoteCity;
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {observer.disconnect(); initialize();}
    }, {rootMargin:'300px'});
    observer.observe(mapElement);
  } else initialize();
  const preferredDate = document.getElementById('preferredDate');
  if (preferredDate) {
    const now = new Date();
    preferredDate.min = [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  }
})();
