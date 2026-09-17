class AppFooter extends HTMLElement {
  connectedCallback() {
    // Detect country code from current URL (e.g. /ng/..., /gh/..., /us/...)
    const parts = window.location.pathname.split('/').filter(Boolean);
    const validCC = ['ng', 'gh', 'us'];
    this.cc = validCC.includes(parts[0]) ? parts[0] : 'ng';
    this.render();
  }

  render() {
    const cc = this.cc;
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
                <li><a href="/${cc}/about-us">About Us</a></li>
                <li><a href="/${cc}/contact-us">Contact Us</a></li>
              </ul>
            </div>
            
            <div class="mec-footer__links">
              <h4>Legal</h4>
              <ul>
                <li><a href="/${cc}/privacy-policy">Privacy Policy</a></li>
                <li><a href="/${cc}/terms-of-service">Terms of Service</a></li>
                <li><a href="/${cc}/disclaimer">Disclaimer</a></li>
              </ul>
            </div>

            <div class="mec-footer__links">
              <h4>Study Guides</h4>
              <ul>
                <li><a href="/ng/landing/jamb">JAMB CBT Guide</a></li>
                <li><a href="/ng/landing/waec">WAEC Past Questions</a></li>
                <li><a href="/ng/landing/uniben-post-utme">UNIBEN Post UTME</a></li>
                <li><a href="/us/landing/sat">SAT Prep Guide</a></li>
              </ul>
            </div>

            <div class="mec-footer__links">
              <h4>Partner Sites</h4>
              <ul>
                <li><a href="https://myschool.ng" target="_blank" rel="noopener">MySchool.ng — JAMB &amp; WAEC Resources</a></li>
                <li><a href="https://myschool.ng/jamb" target="_blank" rel="noopener">JAMB Past Questions</a></li>
                <li><a href="https://myschool.ng/waec" target="_blank" rel="noopener">WAEC Past Questions</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="mec-footer__bottom">
          <p>&copy; ${new Date().getFullYear()} My Exam Companion. All rights reserved. Powered by <a href="https://myschool.ng" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;font-weight:600;">MySchool.ng</a>.</p>
        </div>
      </footer>
    `;
  }
}

customElements.define('app-footer', AppFooter);
