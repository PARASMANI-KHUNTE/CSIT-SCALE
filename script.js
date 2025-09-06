// Theme toggle with persistence
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeToggleMobile = document.getElementById('themeToggleMobile');

// Function to update Mermaid theme based on current theme
function updateMermaidTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  mermaid.initialize({
    ...mermaid.mermaidAPI.getConfig(),
    theme: isDark ? 'dark' : 'default'
  });
  // Re-render all diagrams
  mermaid.init(undefined, '.mermaid');
}

// Watch for theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      updateMermaidTheme();
    }
  });
});

// Start observing the document with the configured parameters
observer.observe(document.documentElement, { attributes: true });

function setTheme(mode){
  if(mode==='dark'){ root.classList.add('dark'); localStorage.setItem('theme','dark'); }
  else { root.classList.remove('dark'); localStorage.setItem('theme','light'); }
}

document.addEventListener('DOMContentLoaded', () => {
  const themeToggles = [
    themeToggle,
    themeToggleMobile
  ].filter(Boolean);
  
  const html = document.documentElement;
  
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (savedTheme) {
    html.classList.add(savedTheme);
    updateThemeToggles(savedTheme);
  }

  // Toggle theme on button click
  themeToggles.forEach(toggle => {
    toggle?.addEventListener('click', () => {
      const isDark = html.classList.toggle('dark');
      const theme = isDark ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
      updateThemeToggles(theme);
    });
  });

  // Update all theme toggle buttons
  function updateThemeToggles(theme) {
    themeToggles.forEach(button => {
      if (button) {
        button.textContent = theme === 'dark' ? '☀️' : '🌙';
      }
    });
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 100, // Adjust for header height
        behavior: 'smooth'
      });
      
      // Update URL without adding to history
      history.replaceState(null, null, targetId);
    }
  });
});

// TOC active link highlighting
const sections = Array.from(document.querySelectorAll('main [id]'));
const tocLinks = Array.from(document.querySelectorAll('.toc-link'));

// Highlight active section in TOC
const updateActiveLink = () => {
  const scrollPosition = window.scrollY + 120; // Adjust for header height + some padding
  
  // Find the current section in view
  let currentSection = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop - 120 && scrollPosition < sectionTop + sectionHeight - 120) {
      currentSection = '#' + section.id;
    }
  });
  
  // Update active state of TOC links
  tocLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === currentSection);
  });
};

// Set up intersection observer for sections
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      updateActiveLink();
    }
  });
}, {
  rootMargin: '-20% 0px -70% 0px',
  threshold: 0.1
});

// Observe all sections
sections.forEach(section => io.observe(section));

// Update active link on scroll
let isScrolling;
window.addEventListener('scroll', () => {
  // Clear our timeout throughout the scroll
  window.clearTimeout(isScrolling);
  
  // Set a timeout to run after scrolling ends
  isScrolling = setTimeout(() => {
    updateActiveLink();
  }, 100);
}, { passive: true });

// Initial update
updateActiveLink();

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