/* iCanCall onboarding — app shell, state machine, tweaks */

const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "split",
  "accent": ["#3f7fc4", "#2f6396"],
  "showRailLede": true
}/*EDITMODE-END*/;

function readParams() {
  const q = new URLSearchParams(location.search);
  const plan = ['essential', 'pro'].includes(q.get('plan')) ? q.get('plan') : 'essential';
  const billing = ['monthly', 'annual'].includes(q.get('billing')) ? q.get('billing') : 'monthly';
  return { plan, billing };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const init = readParams();

  const [step, setStep] = useStateA(0); // 0..4 (4 = success)
  const [data, setData] = useStateA({
    plan: init.plan,
    billing: init.billing,
    account: { name: '', email: '', password: '' },
    numbers: [],
    payment: { name: '', card: '', exp: '', cvc: '' },
  });

  const set = (patch) => setData((d) => ({ ...d, ...patch }));

  // apply accent palette to CSS variables
  useEffectA(() => {
    const pal = Array.isArray(t.accent) ? t.accent : [t.accent, t.accent];
    document.documentElement.style.setProperty('--accent', pal[0]);
    document.documentElement.style.setProperty('--accent-deep', pal[1] || pal[0]);
  }, [t.accent]);

  // scroll content to top on step change
  useEffectA(() => {
    const el = document.querySelector('.content-body');
    if (el) el.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // when plan changes, drop any extra selected numbers beyond the new cap
  useEffectA(() => {
    const cap = planById(data.plan).numbers;
    if (data.numbers.length > cap) set({ numbers: data.numbers.slice(0, cap) });
  }, [data.plan]); // eslint-disable-line

  const success = step === 4;

  return (
    <Shell layout={t.layout} stepIndex={Math.min(step, 3)} hideChrome={success}>
      {step === 0 && <AccountStep data={data} set={set} onNext={next} />}
      {step === 1 && <PlanStep data={data} set={set} onNext={next} onBack={back} />}
      {step === 2 && <NumberStep data={data} set={set} onNext={next} onBack={back} />}
      {step === 3 && <PaymentStep data={data} set={set} onNext={next} onBack={back} />}
      {step === 4 && <SuccessStep data={data} />}

      <TweaksPanel>
        <TweakSection label="Layout" />
        <TweakRadio label="Style" value={t.layout}
          options={['split', 'centered']}
          onChange={(v) => setTweak('layout', v)} />
        <TweakSection label="Accent" />
        <TweakColor label="Brand accent" value={t.accent}
          options={[['#3f7fc4', '#2f6396'], ['#2c97a8', '#1f7080'], ['#5b6cc4', '#414f96'], ['#3aa07a', '#27795c']]}
          onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </Shell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
