import os
import re

print('🔧 Corrigindo todos os arquivos...')

# 1. CORRIGE main.jsx
main_code = """import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
"""

with open('src/main.jsx', 'w', encoding='utf-8') as f:
    f.write(main_code)
print('✅ main.jsx corrigido')

# 2. CORRIGE Player.jsx
files_to_fix = ['src/pages/Player.jsx', 'src/components/SetlistCard.jsx', 'src/pages/Home.jsx']

for file_path in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Corrigir operadores
        content = re.sub(r'\s*&\s*&\s*', ' && ', content)
        content = re.sub(r'\s*=\s*>\s*', ' => ', content)
        
        # Corrigir strings e variáveis quebradas
        content = content.replace("t` `ranslate-y-0'", "'translate-y-0'")
        content = content.replace("men uVisible", "menuVisible")
        content = content.replace("beat Count", "beatCount")
        content = content.replace("activeSecti on", "activeSection")
        content = content.replace("rou nded", "rounded")
        content = content.replace("bor der", "border")
        content = content.replace("jus tify", "justify")
        content = content.replace("ro unded", "rounded")
        content = content.replace("font Bold", "fontBold")
        content = content.replace("hover:border-accent/60 hover:bg-accent/10", "hover:border-accent/60 hover:bg-accent/10")
        content = content.replace("shadow -md", "shadow-md")
        content = content.replace("text-g ray-900", "text-gray-900")
        content = content.replace("text -gray-900", "text-gray-900")
        content = content.replace("flex  items", "flex items")
        content = content.replace("hover :text-text", "hover:text-text")
        content = content.replace("text-muted  hover", "text-muted hover")
        
        # Corrigir className quebrado
        content = re.sub(r'className=\s*"', 'className="', content)
        content = re.sub(r'" \s*>', '">', content)
        content = re.sub(r'</\s*', '</', content)
        content = re.sub(r'/\s*>', '/>', content)
        
        # Corrigir regex
        content = content.replace('(?:([^)]))?', '(?:\([^)]*\))?')
        content = content.replace('/[[]()]/g', '/[\\[\\]\\(\\)]/g')
        content = content.replace('/|+$/g', '/\\|+$/g')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'✅ {file_path} corrigido')

print('\n🔨 Agora execute:')
print('   npm run build')
print('   git add .')
print('   git commit -m "Corrige todos os erros de sintaxe"')
print('   git push --force')