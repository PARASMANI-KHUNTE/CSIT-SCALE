// Theme toggle with persistence
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
function setTheme(mode){
  if(mode==='dark'){ root.classList.add('dark'); localStorage.setItem('theme','dark'); themeToggle.textContent='☀️'; }
  else { root.classList.remove('dark'); localStorage.setItem('theme','light'); themeToggle.textContent='🌙'; }
}
setTheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle.addEventListener('click',()=>{ 
  setTheme(root.classList.contains('dark') ? 'light' : 'dark');
});

// TOC active link highlighting
const sections = Array.from(document.querySelectorAll('main [id]'));
const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const id = '#' + entry.target.id;
      tocLinks.forEach(a=>{
        a.classList.toggle('text-emerald-600', a.getAttribute('href')===id);
        a.classList.toggle('font-semibold', a.getAttribute('href')===id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });
sections.forEach(sec=>io.observe(sec));

// Expand/Collapse helpers
function expandAll(open=true){
  document.querySelectorAll('details').forEach(d=>d.open = open);
}
window.expandAll = expandAll;

// Mobile sidebar toggle
const menuOpen = document.getElementById('menuOpen');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const tocLinksSidebar = sidebar.querySelectorAll('.toc-link');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarBackdrop.classList.remove('hidden');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.add('hidden');
}

menuOpen?.addEventListener('click', openSidebar);
sidebarBackdrop?.addEventListener('click', closeSidebar);
tocLinksSidebar.forEach(link => {
  link.addEventListener('click', closeSidebar);
});

// Simple search (highlights matching sections & lists results)
const searchOpen = document.getElementById('searchOpen');
const searchOpenMobile = document.getElementById('searchOpenMobile');
const searchDialog = document.getElementById('searchDialog');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

function openSearch(){ searchDialog.classList.remove('hidden'); searchDialog.classList.add('flex'); searchInput.focus(); }
function closeSearch(){ searchDialog.classList.add('hidden'); searchDialog.classList.remove('flex'); searchInput.value=''; searchResults.innerHTML=''; clearHighlights(); }

searchOpen?.addEventListener('click', openSearch);
searchOpenMobile?.addEventListener('click', openSearch);
searchClose?.addEventListener('click', closeSearch);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeSearch(); if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k') openSearch(); });

function clearHighlights(){ document.querySelectorAll('.highlight').forEach(el=>{ el.classList.remove('highlight','bg-yellow-200','dark:bg-yellow-800'); }); }

function doSearch(q){
  const query = q.trim().toLowerCase();
  searchResults.innerHTML=''; clearHighlights();
  if(!query) return;
  const blocks = Array.from(document.querySelectorAll('main section, main article, main details'));
  const matches = [];
  blocks.forEach(block=>{
    const text = block.innerText.toLowerCase();
    if(text.includes(query)){
      block.classList.add('highlight','bg-yellow-200','dark:bg-yellow-800');
      const id = block.getAttribute('id') || block.querySelector('h2,h3,h4')?.textContent?.toLowerCase().replace(/[^a-z0-9]+/g,'-');
      matches.push({el:block, id, title: block.querySelector('h2,h3,h4,summary')?.textContent?.trim() || 'Section'});
    }
  });
  if(matches.length===0){
    searchResults.innerHTML = '<p class="p-3 text-zinc-500">No matches found.</p>';
    return;
  }
  matches.forEach((m,i)=>{
    const a = document.createElement('a');
    a.href = m.el.id ? '#' + m.el.id : '#';
    a.className = 'block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800';
    a.textContent = (i+1)+'. '+m.title;
    a.addEventListener('click', closeSearch);
    searchResults.appendChild(a);
  });
}
searchInput?.addEventListener('input', (e)=> doSearch(e.target.value));