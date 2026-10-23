(() => {
  document.querySelectorAll('[data-plan-service]').forEach(link => {
    link.addEventListener('click', () => {
      const service = document.getElementById('service');
      const frequency = document.getElementById('frequency');
      const propertyType = document.getElementById('propertyType');
      if (service) service.value = link.dataset.planService;
      if (frequency) frequency.value = link.dataset.planFrequency || 'One-time';
      if (propertyType && ['Office','Commercial Space'].includes(propertyType.value)) {
        propertyType.value = '';
        propertyType.dispatchEvent(new Event('change', {bubbles:true}));
      }
    });
  });
})();
