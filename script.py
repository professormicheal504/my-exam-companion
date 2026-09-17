import sys

filepath = r'c:\myproject\my_exam_companion\public\modules\index.html'
with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

old_str = '''                // Smart routing
                let setupPath = '/modules/cbt_test/core/setup.html';
                if (cat.id === 'university') {
                  setupPath = '/modules/cbt_test/university_exam/university_exam.html';
                } else if (cat.id === 'post_utme') {
                  setupPath = '/modules/cbt_test/core/setup_premium.html';
                }

                if (window.location.pathname.includes('/public/modules/')) {
                  setupPath = `/public${setupPath}`;
                }'''

new_str = '''                // Smart routing
                const cc = (window.MEC_NAV && window.MEC_NAV.getCountry) ? window.MEC_NAV.getCountry() : 'ng';
                let setupPath = `/${cc}/cbt_test/core/setup.html`;
                if (cat.id === 'university') {
                  setupPath = `/${cc}/cbt_test/university_exam/university_exam.html`;
                } else if (cat.id === 'post_utme') {
                  setupPath = `/${cc}/cbt_test/core/setup_premium.html`;
                }

                if (window.location.pathname.includes('/public/modules/')) {
                  setupPath = `/public/modules${setupPath.replace(`/${cc}/`, '/')}`;
                }'''

content = content.replace(old_str, new_str)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
