(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initParticles('particles');
    initPasswordToggle();
    initFormValidation();
  });

  function initPasswordToggle() {
    const toggle = document.getElementById('password-toggle');
    const input = document.getElementById('password');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (!toggle || !input) return;

    toggle.addEventListener('click', function () {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      if (eyeOpen) eyeOpen.style.display = show ? 'none' : 'block';
      if (eyeClosed) eyeClosed.style.display = show ? 'block' : 'none';
    });
  }

  function initFormValidation() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const submitBtn = document.getElementById('submit-btn');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function clearError(input, errorEl) {
      input.classList.remove('form-input--error');
      errorEl.classList.remove('visible');
      errorEl.textContent = '';
    }

    function setError(input, errorEl, message) {
      input.classList.add('form-input--error');
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }

    function validateEmail() {
      const value = emailInput.value.trim();
      if (!value) {
        setError(emailInput, emailError, 'Email is required.');
        return false;
      }
      if (!emailRegex.test(value)) {
        setError(emailInput, emailError, 'Please enter a valid email address.');
        return false;
      }
      clearError(emailInput, emailError);
      return true;
    }

    function validatePassword() {
      const value = passwordInput.value;
      if (!value) {
        setError(passwordInput, passwordError, 'Password is required.');
        return false;
      }
      clearError(passwordInput, passwordError);
      return true;
    }

    emailInput.addEventListener('input', function () {
      if (emailError.classList.contains('visible')) validateEmail();
    });

    passwordInput.addEventListener('input', function () {
      if (passwordError.classList.contains('visible')) validatePassword();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailOk = validateEmail();
      const passwordOk = validatePassword();

      if (!emailOk || !passwordOk) return;

      submitBtn.disabled = true;
      submitBtn.classList.add('loading');

      setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }, 1500);
    });
  }
})();
