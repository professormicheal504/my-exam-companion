class AppFooter extends HTMLElement {
  connectedCallback() {
    this.base = this.getAttribute('data-base') || './';
    this.render();
  }

  render() {
    this.innerHTML = `
      <footer class="mec-footer">
        <div class="mec-footer__content">
          <div class="mec-footer__brand">
            <h3>My Exam Companion</h3>
            <p>Your ultimate study partner for JAMB, WAEC, and more. Master your subjects with confidence and ease.</p>
          </div>
          
          <div class="mec-footer__links-group">
            <div class="mec-footer__links">
              <h4>Company</h4>
              <ul>
                <li><a href="${this.base}modules/footer/about_us.html">About Us</a></li>
                <li><a href="${this.base}modules/footer/contact_us.html">Contact Us</a></li>
              </ul>
            </div>
            
            <div class="mec-footer__links">
              <h4>Legal</h4>
              <ul>
                <li><a href="${this.base}modules/footer/privacy_policy.html">Privacy Policy</a></li>
                <li><a href="${this.base}modules/footer/terms_of_service.html">Terms of Service</a></li>
                <li><a href="${this.base}modules/footer/disclaimer.html">Disclaimer</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="mec-footer__bottom">
          <p>&copy; ${new Date().getFullYear()} My Exam Companion. All rights reserved.</p>
        </div>
      </footer>
    `;
  }
}

customElements.define('app-footer', AppFooter);
