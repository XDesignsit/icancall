/* ---- Launch list form (pet plans are not in checkout yet) ---- */
(function launchList() {
  const form = document.getElementById('join-form');
  if (!form) return;
  const msg = document.getElementById('join-msg');
  const btn = form.querySelector('button');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.className = 'join-msg err';
      msg.textContent = 'Please enter a valid email address.';
      form.email.focus();
      return;
    }
    btn.disabled = true;
    msg.className = 'join-msg';
    msg.textContent = 'Adding you…';
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      form.reset();
      msg.className = 'join-msg ok';
      msg.textContent = "You're on the list. We'll email you when pet plans open.";
    } catch (err) {
      msg.className = 'join-msg err';
      msg.textContent = err.message || 'Something went wrong. Please try again.';
    } finally {
      btn.disabled = false;
    }
  });
})();
