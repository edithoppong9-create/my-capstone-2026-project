
export function el(tag, props = {}, children = []) {
  // Create the HTML element.
  const element = document.createElement(tag);

  // Add properties, attributes, and event listeners.
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) {
      continue;
    }

    // Handle event listeners such as onClick.
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } 
    // Handle CSS classes.
    else if (key === 'className') {
      element.className = value;
    } 
    // Handle HTML properties such as id, value, and disabled.
    else if (key in element) {
      element[key] = value;
    } 
    // Handle other attributes such as aria-label.
    else {
      element.setAttribute(key, value);
    }
  }

  // Add child elements or text safely.
  function append(child) {
    if (child === null || child === undefined) {
      return;
    }

    if (Array.isArray(child)) {
      child.forEach(append);
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else {
      element.appendChild(document.createTextNode(String(child)));
    }
  }

  append(children);

  return element;
}
