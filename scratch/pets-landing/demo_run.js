  // caller menu: read out the options, the caller presses one, that contact rings
  async function run() {
    while (true) {
      reset();
      const pick = answerPlan[planIdx % answerPlan.length];
      planIdx++;
      await sleep(1100);
      status.textContent = 'Caller menu…';
      states.forEach((s, i) => { s.textContent = 'Press ' + (i + 1); });
      await sleep(2200);

      status.textContent = 'Pressed ' + (pick + 1);
      contacts.forEach((c, i) => { if (i !== pick) { c.classList.add('is-missed'); states[i].textContent = ''; } });
      contacts[pick].classList.add('is-ringing');
      states[pick].textContent = 'Ringing…';
      await sleep(1500);

      contacts[pick].classList.remove('is-ringing');
      contacts[pick].classList.add('is-connected');
      states[pick].textContent = 'Connected ✓';
      status.textContent = 'Connected';
      demo.classList.add('is-connected');
      await sleep(2600);
    }
  }

