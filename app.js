const timers = new WeakMap();
let lastMessage = '';

function getCopyText(target) {
  const { user, domain } = target.dataset;
  if (user && domain) {
    return `${user}@${domain}`;
  }
  return target.matches('input, textarea') ? target.value : target.innerText.trim();
}

function legacyCopy(text) {
  const field = Object.assign(document.createElement('textarea'), { value: text });
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
  document.body.append(field);
  field.select();
  try {
    return document.execCommand('copy');
  } finally {
    field.remove();
  }
}

function report(button, ok) {
  const tip = button.nextElementSibling;
  clearTimeout(timers.get(button));
  button.removeAttribute('data-copied');
  button.removeAttribute('data-failed');

  let message = ok ? 'Copied' : 'Copy failed';
  if (message === lastMessage) message += '\u00A0';
  lastMessage = message;

  tip.textContent = '';
  void button.offsetWidth;
  button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
  requestAnimationFrame(() => {
    tip.textContent = message;
  });

  timers.set(
    button,
    setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      tip.textContent = '';
    }, 2000),
  );
}

async function copy(button, target) {
  const text = getCopyText(target);
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    report(button, true);
  } catch {
    if (legacyCopy(text)) {
      report(button, true);
    } else {
      report(button, false);
    }
  }
}

if ('CommandEvent' in window) {
  document.addEventListener(
    'command',
    (event) => {
      if (event.command === '--copy' && event.source && event.target) {
        copy(event.source, event.target);
      }
    },
    true,
  );
} else {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button[command="--copy"]');
    if (!button) return;
    const target = document.getElementById(button.getAttribute('commandfor'));
    if (target) copy(button, target);
  });
}
