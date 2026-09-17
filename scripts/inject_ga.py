import os

ga_script = """
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-CHG6831RHH"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-CHG6831RHH');
  </script>
</head>"""

def inject_ga():
    public_dir = os.path.join(os.getcwd(), 'public')
    count = 0
    for root, dirs, files in os.walk(public_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if GA is already there
                if 'G-CHG6831RHH' in content:
                    continue
                
                # Inject just before </head>
                if '</head>' in content:
                    content = content.replace('</head>', ga_script, 1)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    count += 1
    
    print(f"Successfully injected Google Analytics into {count} HTML files.")

if __name__ == '__main__':
    inject_ga()
