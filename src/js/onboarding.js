(function() {
  const form = document.querySelector('form.onboarding-form');
  if (!form) return;

  const stages = form.querySelectorAll('.stage');
  const progressEl = form.querySelector('.progress-indicator');
  let currentStage = 0;

  function showStage(index) {
    stages.forEach(function(stage, i) {
      if (i === index) {
        stage.removeAttribute('hidden');
      } else {
        stage.setAttribute('hidden', '');
      }
    });
    currentStage = index;
    updateProgress();
  }

  function updateProgress() {
    if (!progressEl) return;
    progressEl.textContent = 'Step ' + (currentStage + 1) + ' of ' + stages.length;
  }

  function validateStage(stage) {
    const required = stage.querySelectorAll('.required');
    let valid = true;
    for (var i = 0; i < required.length; i++) {
      if (!required[i].value.trim()) {
        required[i].classList.add('needs-content');
        valid = false;
      } else {
        required[i].classList.remove('needs-content');
      }
    }
    return valid;
  }

  for (var s = 0; s < stages.length; s++) {
    (function(index) {
      var stage = stages[index];
      var nextBtn = stage.querySelector('.btn-next');
      var prevBtn = stage.querySelector('.btn-prev');

      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          if (validateStage(stage)) {
            showStage(index + 1);
          }
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          showStage(index - 1);
        });
      }
    })(s);
  }

  showStage(0);
})();
