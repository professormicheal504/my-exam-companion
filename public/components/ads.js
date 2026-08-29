class AppAd extends HTMLElement {
  connectedCallback() {
    this.type = this.getAttribute('type') || 'banner';
    this.render();
  }

  render() {
    // Shared Ad Config. Change here, affects everywhere!
    const adConfig = {
      banner: {
        label: 'Advertisement',
        content: 'Premium Banner Ad Space',
        style: `
          .ad-container {
            grid-column: 1 / -1;
            width: 100%;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            margin: 8px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
          }
          /* Support light/dark themes dynamically */
          :host-context([data-theme="dark"]) .ad-container,
          html[data-theme="dark"] .ad-container {
            background: #1e293b;
            border-color: #334155;
            color: #64748b;
          }
          .ad-container span {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .ad-container p {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
          }
        `
      }
    };

    const config = adConfig[this.type] || adConfig.banner;

    // Use innerHTML to encapsulate the styles and content
    this.innerHTML = `
      <style>${config.style}</style>
      <div class="ad-container">
        <span>${config.label}</span>
        <p>${config.content}</p>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('app-ad', AppAd);
