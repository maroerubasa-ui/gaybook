
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered!'))
      .catch(err => console.log('Registration failed:', err));
  });
}

const SUPABASE_URL = 'https://jdazvxuxvqrplncmdhzy.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkYXp2eHV4dnFycGxuY21kaHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjIxNTQsImV4cCI6MjA4MjY5ODE1NH0.wYRXeLZgl-al86GWgwYScv7Psc8LzpaoKhIB-CpV4QE'; 

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const memory = {
    galleryItems: [],
    postsContent: {},
    currentOffset: 0,
    hasMore: true,
    libraryScripts: [],
    triggeredMilestones: new Set(),
    cachedStats: {} 
};

let dynamicMessages = {};
let initialLoadDone = false; 
let globalAdsLoaded = false;

const fallbackMessages = {
    10: { emoji: '😏', text: "Oh? So you’re into this trope too? I see you..." },
    25: { emoji: '😳', text: "Look at your face—you’re totally blushing right now." },
    50: { emoji: '🍿', text: "Don't stop now, I need to know what happens next too!" },
    75: { emoji: '😱', text: "Wait, wait... did he just say that?! *Gasps*" },
    95: { emoji: '🤐', text: "Are you holding your breath? Because I definitely am." },
    100: { emoji: '👄', text: "Hi, I love reading erotic gaybook.site stories, do you love them too?" }
};

async function loadGlobalAds() {
    if (globalAdsLoaded) return;
    globalAdsLoaded = true;

    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', ['video_slider_ad', 'notification_ad']);

        if (error) {
            console.error('Error fetching global ads:', error);
            return;
        }

        if (data) {
            data.forEach(adRecord => {
                if (adRecord.value) {
                    const adContainer = document.createElement('div');
                    adContainer.innerHTML = adRecord.value;
                    document.body.appendChild(adContainer);

                    const scripts = adContainer.getElementsByTagName('script');
                    for (let i = 0; i < scripts.length; i++) {
                        const newScript = document.createElement('script');
                        if (scripts[i].src) {
                            newScript.src = scripts[i].src;
                            newScript.async = true;
                        } else {
                            newScript.text = scripts[i].textContent;
                        }
                        document.body.appendChild(newScript);
                    }
                }
            });
        }
    } catch (err) {
        console.error('Failed to load global ads from Supabase:', err);
    }
}

function initAdInterval() {
    setInterval(() => {
        console.log('Periodic ad health check...');
    }, 300000); 
}

function formatCompactNumber(number) {
    if (number === undefined || number === null) return '0';
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(number).toLowerCase();
}

const searchContainer = document.getElementById('searchContainer');
const searchIcon = document.getElementById('searchIcon');
const searchIconI = searchIcon.querySelector('i');
const closeIconWrapper = document.getElementById('closeIconWrapper');
const searchInput = document.getElementById('searchInput');
const homePageContainer = document.getElementById('homePageContainer'); 
const postPage = document.getElementById('postPage');
const postTitleElement = document.getElementById('postTitle');
const body = document.body;
const homeGallery = document.getElementById('homeGallery');
const brandNameLink = document.getElementById('brandNameLink');
const loadMoreButton = document.getElementById('loadMoreButton');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const bookContent = document.getElementById('book-content');
const readingBar = document.getElementById('readingBar');
const readingCounter = document.getElementById('readingCounter');
const flyOutContent = document.getElementById('flyOutContent');
const flyEmoji = document.getElementById('flyEmoji');
const flyText = document.getElementById('flyText');

const ITEMS_PER_LOAD = 12; 
let currentSearchQuery = '';
let searchDebounceTimer;

async function logPostView(postId, chapterId = null) {
    try {
        const { error } = await supabase
            .from('post_views')
            .insert([{ post_id: String(postId), chapter_id: chapterId ? parseInt(chapterId) : null }]);
        if (error) console.error('View tracking error:', error.message);
    } catch (err) { console.error('Analytics failed:', err); }
}

async function getPostStats(postId, slug) {
    if (memory.cachedStats[postId]) return memory.cachedStats[postId];
    try {
        const { data: stats, error } = await supabase
            .from('post_stats')
            .select('views_total, views_today')
            .or(`post_id.eq.${postId},slug.eq.${slug}`)
            .maybeSingle();

        if (error) throw error;

        const viewCount = stats ? (parseInt(stats.views_total) || 0) : 0;
        const todayCount = stats ? (parseInt(stats.views_today) || 0) : 0;

        memory.cachedStats[postId] = { viewCount, todayCount };
        return memory.cachedStats[postId];
    } catch (err) {
        console.error("Stats Fetch Error:", err);
        return { viewCount: 0, todayCount: 0 };
    }
}

function initSplashScreen() {
    const bgContainer = document.getElementById('splash-bg-container');
    if (!bgContainer) return;

    const backgrounds = [
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/15342376.gif',
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/22600551.gif',
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/ezgif-40091d8e4a279186%20(1).gif',
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/ezgif-40db559a86d35875%20(1).gif',
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/ezgif-41da2e0cfde01e78%20(1).gif',
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/ezgif-4a9992fb19cc015a%20(1).gif',
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/ezgif-4b575af810db3037%20(1).gif',
        'https://jdazvxuxvqrplncmdhzy.supabase.co/storage/v1/object/public/Assets/yaoi-gif-yaoi-gay-zone-explicit-yaoi-6732980.gif',
    ];

    const randomIdx = Math.floor(Math.random() * backgrounds.length);
    bgContainer.style.backgroundImage = `url('${backgrounds[randomIdx]}')`;
}

async function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const bgContainer = document.getElementById('splash-bg-container');
    if (!splash || initialLoadDone) return;

    setTimeout(() => {
        splash.classList.add('splash-hidden');
        initialLoadDone = true;
        
        loadGlobalAds();
        initAdInterval();
        
        setTimeout(() => {
            if(bgContainer) bgContainer.style.backgroundImage = 'none';
        }, 1000);
    }, 8000);
}

async function handleRoute() {
    if (!initialLoadDone) initSplashScreen();

    const route = getRouteInfo();
    const isHome = !route.slug;
    homePageContainer.classList.toggle('visible', isHome);
    postPage.classList.toggle('visible', !isHome);
    body.classList.toggle('is-post-page', !isHome);
    
    try {
        if (isHome) {
            searchContainer.classList.remove('active');
            memory.cachedStats = {}; 
            await loadHomePage(searchInput.value, true); 
            document.title = 'Free uncensored Gay & BL Stories';
            
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
            metaDesc.content = "The ultimate destination for the best uncensored BL stories and gay literature. Dive into curated narratives and complex fictional worlds.";
            window.scrollTo(0, 0);
            
        } else {
            await loadPostPage(route.slug, route.chapterNum);
            searchContainer.classList.remove('active');
        }
    } catch (globalError) {
        console.error("Routing execution error encountered:", globalError);
        window.scrollTo(0, 0);
    } finally {
        hideSplashScreen();
    }
}

async function loadPostPage(slug, chapterNum) {
    window.renderComplete = false;
    memory.triggeredMilestones.clear(); 
    postTitleElement.innerHTML = '';
    bookContent.innerHTML = '<div class="spa-loader">Hold on... opening the book for you.</div>';
    
    const post = await fetchPost(slug); 
    if (post) {
        renderPostContent(post, chapterNum);
        document.title = `${post.title} - Chapter ${chapterNum}`;
        logPostView(post.id, post.chapters[parseInt(chapterNum)-1]?.id);

        window.scrollTo(0, 0);
        updateProgress();
    } else {
        window.history.replaceState(null, '', '/');
        handleRoute(); 
    }
}

async function createGalleryItem(post) {
    const identifier = post.slug || post.id;
    const title = post.title || 'Untitled Post';
    const summary = post.summary || 'Tap to read more about this story...';
    const imgUrl = post.thumbnail_url || 'https://via.placeholder.com/320x300?text=No+Image';
    
    const calculatedTime = post.read_time || 7; 
    const chapterCount = post.chapters ? post.chapters.length : 0;

    const publishDate = post.created_at 
        ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent';

    const stats = await getPostStats(post.id, post.slug);
    const trendingIcon = stats.todayCount > 5 ? `<span style="color: #ff4d4d;"><i class="fas fa-fire"></i></span>` : '';
    const formattedViews = formatCompactNumber(stats.viewCount);

    return `
        <div class="gallery-item" onclick="navigateToPost('${identifier}')">
            <img src="${imgUrl}" alt="${title}">
            <div class="item-details">
                <span class="item-title">${title} ${trendingIcon}</span>
                <p class="item-summary">${summary}</p>
                <div class="item-stats-container">
                    <div class="item-stats">
                        <span><i class="fas fa-book-open"></i> ${chapterCount} ${chapterCount === 1 ? 'Ch' : 'Chs'}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${publishDate}</span>
                    </div>
                    <div class="item-stats">
                        <span><i class="fas fa-clock"></i> ${calculatedTime} min read</span>
                        <span><i class="fas fa-eye"></i> ${formattedViews} views</span>
                    </div>
                </div>
            </div>
        </div>`;
}

async function fetchGalleryItems(query = '', offset = 0) {
    let supabaseQuery = supabase
        .from('posts')
        .select('id, title, summary, thumbnail_url, tags, slug, created_at, read_time, chapters(id)') 
        .eq('is_published', true) 
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_LOAD - 1);
        
    if (query) { supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,tags.ilike.%${query}%`); }
    const { data, error } = await supabaseQuery;
    if (error) return { data: [], hasMore: false };
    return { data: data || [], hasMore: data?.length === ITEMS_PER_LOAD };
}

async function fetchPost(identifier) {
    if (memory.postsContent[identifier]) {
        // Ensure cached post always has the latest library attached
        memory.postsContent[identifier].affiliate_scripts = memory.libraryScripts || [];
        return memory.postsContent[identifier];
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; 
    const isUuid = uuidRegex.test(identifier);
    
    let query = supabase.from('posts').select(`
            id, title, thumbnail_url, summary, commentary, slug, created_at,
            chapters:chapters(id, title, chapter_image_url, commentary, order, content_blocks:content_blocks(*))
        `);
        
    if (isUuid) query = query.eq('id', identifier);
    else query = query.eq('slug', identifier);
    
    const { data, error } = await query.single();
    if (error) return null;

    // Attach the pre-fetched library directly
    data.affiliate_scripts = memory.libraryScripts || [];

    if (data && data.chapters) {
        data.chapters.sort((a,b) => (a.order || 0) - (b.order || 0));
        data.chapters.forEach(chapter => {
            chapter.content = (chapter.content_blocks || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        });
    }
    
    memory.postsContent[identifier] = data;
    return data;
}


function navigateToPost(identifier) {
    const postPath = `/${identifier}/1`;
    fireExoclickAd(postPath);
}

async function renderGallery(items, append = false) {
    if (!append) homeGallery.innerHTML = '';
    if (!items || items.length === 0) {
         if (!append) {
             homeGallery.innerHTML = '<p style="text-align:center; padding: 40px;">Bestie... not a single book showed up. The audacity. Try something else.</p>';
             loadMoreContainer.style.display = 'none';
         }
         return;
    }
    const itemHtmls = await Promise.all(items.map(item => createGalleryItem(item)));
    const html = itemHtmls.join('');
    if (append) homeGallery.insertAdjacentHTML('beforeend', html);
    else homeGallery.innerHTML = html;
}

function parseInlineStyling(text) {
    if(!text) return '';
    let formattedText = text;
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>'); 
    return formattedText;
}

function decodeHtmlEntities(str) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
}

function renderAffiliateScript(scriptRecord) {
    if (!scriptRecord) return '';
    
    const rawCode = String(scriptRecord.script_code || '').trim();
    
    if (!rawCode) return '';
    
    const code = decodeHtmlEntities(rawCode);
    
    return `
        <div class="affiliate-script-container" data-processed="false">
            ${code}
        </div>
    `;
}
function executeInjectedScripts(containerElement) {
    setTimeout(() => {
        const containers = containerElement.querySelectorAll('.affiliate-script-container');
        
        containers.forEach(container => {
            const scripts = container.getElementsByTagName('script');
            
            Array.from(scripts).forEach(oldScript => {
                const newScript = document.createElement('script');
                
                for (let j = 0; j < oldScript.attributes.length; j++) {
                    const attr = oldScript.attributes[j];
                    newScript.setAttribute(attr.name, attr.value);
                }
                
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                    newScript.async = true;
                } else {
                    newScript.text = oldScript.textContent || oldScript.innerText || '';
                }
                
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        });
    }, 100);
}

function renderComponent(block, library) {
    if(!block) return '';
    switch (block.type) {
        case 'paragraph': 
            let cleanText = block.text || '';
            cleanText = cleanText.replace(/class="post-paragraph"/gi, '').replace(/post-paragraph/gi, '');
            cleanText = cleanText.replace(/<br\s*\/?>/gi, '<br>');
            return `<p class="post-paragraph">${parseInlineStyling(cleanText)}</p>`;
            
        case 'image': 
            return `<div class="image-slot"><img src="${block.url}" alt="${block.caption || ''}" class="chapter-illustration"></div>`;
            
        case 'affiliate-cta':
            // Check all possible identifiers from content_blocks and affiliate_scripts
            const targetId = String(block.script_id || block.product_id || block.id || '').trim();
            
            const scriptRec = (library || []).find(p => {
                const pScriptId = String(p.script_id || '').trim();
                const pId = String(p.id || '').trim();
                return pScriptId === targetId || pId === targetId;
            });
            
            if (scriptRec) {
                return renderAffiliateScript(scriptRec);
            }
            
            // This will now clearly scream the exact block and ID it's failing on if anything is off
            return `<div style="border: 2px dashed #ff4d4d; background: rgba(255,77,77,0.1); padding: 15px; text-align: center; color: #ff4d4d; font-size: 0.85rem; margin: 20px 0; font-family: monospace;">
                <strong>[AFFILIATE SCRIPT MATCH FAILED]</strong><br>
                Content block tried to look up ID: <u>"${targetId || 'EMPTY/NULL'}"</u><br>
                Available IDs in table: ${(library || []).map(p => p.script_id).join(', ') || 'None loaded'}
            </div>`;
            
        default: 
            return '';
    }
}



function updateSEOData(post, chapterNum, chapter) {
    const seoText = document.getElementById('seo-text');
    const seoImg = document.getElementById('seo-image');
    const seoLink = document.getElementById('seo-link');
    const currentNum = parseInt(chapterNum);
    if (currentNum === 1) {
        if(seoText) seoText.textContent = post.summary;
        if(seoImg) seoImg.src = post.thumbnail_url;
    } else if (chapter) {
        const firstParagraph = chapter.content.find(block => block.type === 'paragraph');
        if(seoText) seoText.textContent = firstParagraph?.text || `Chapter ${chapterNum}`;
        if(seoImg) seoImg.src = chapter.chapter_image_url || post.thumbnail_url;
    }
    if(seoLink) seoLink.href = window.location.href;
    window.renderComplete = true; 
}

function updateSchemaMarkup(post, chapterNum, chapter) {
    const oldSchema = document.getElementById('dynamic-schema');
    if (oldSchema) oldSchema.remove();
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": `${post.title} - Chapter ${chapterNum}`,
        "description": post.summary,
        "image": chapter?.chapter_image_url || post.thumbnail_url,
        "author": { "@type": "Person", "name": "Maro Alero Erubasa" }
    };
    const script = document.createElement('script');
    script.id = 'dynamic-schema'; script.type = 'application/ld+json'; script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
}

function renderChapterNavigation(post, currentIdx) {
    const slug = post.slug || post.id;
    const totalChapters = post.chapters.length;
    const chapterButtons = post.chapters.map((_, index) => {
        const chapterNum = index + 1;
        const isActive = index === currentIdx;
        return `<button class="nav-num-btn ${isActive ? 'active' : ''}" onclick="fireExoclickAd('/${slug}/${chapterNum}')" ${isActive ? 'disabled' : ''}>${chapterNum}</button>`;
    }).join('');
    return `
        <div class="chapter-pagination-container">
            <button class="nav-icon-btn ${currentIdx === 0 ? 'disabled' : ''}" onclick="fireExoclickAd('/${slug}/${currentIdx}')"><i class="fas fa-chevron-left"></i></button>
            <div class="chapter-numbers">${chapterButtons}</div>
            <button class="nav-icon-btn ${currentIdx >= totalChapters - 1 ? 'disabled' : ''}" onclick="fireExoclickAd('/${slug}/${currentIdx + 2}')"><i class="fas fa-chevron-right"></i></button>
        </div>
    `;
}

function renderPostContent(post, chapterNum) {
    const chapterIdx = parseInt(chapterNum) - 1;
    const chapter = post.chapters[chapterIdx];
    if (!chapter) { bookContent.innerHTML = '<p>Chapter not found.</p>'; return; }
    
    if (chapter.commentary && Array.isArray(chapter.commentary) && chapter.commentary.length > 0) {
        dynamicMessages = chapter.commentary.reduce((acc, item) => { acc[item.percent] = { emoji: item.emoji, text: item.text }; return acc; }, {});
    } else { dynamicMessages = fallbackMessages; }

    let html = `<section class="chapter"><h2 class="chapter-title">Chapter ${chapterNum}: ${chapter.title}</h2>`;
    if (chapter.chapter_image_url) html += `<div class="image-slot"><img src="${chapter.chapter_image_url}" class="chapter-illustration"></div>`;
    if (chapter.content) html += chapter.content.map(block => renderComponent(block, post.affiliate_scripts)).join('');
    html += `</section>`;
    html += renderChapterNavigation(post, chapterIdx);
    
    postTitleElement.textContent = post.title;
    bookContent.innerHTML = html;
    
    executeInjectedScripts(bookContent);

    updateSEOData(post, chapterNum, chapter);
    updateSchemaMarkup(post, chapterNum, chapter);
}

function triggerFlyOut(milestone) {
    const data = dynamicMessages[milestone] || fallbackMessages[milestone];
    if (!data) return;
    flyEmoji.textContent = data.emoji;
    flyText.textContent = data.text;
    flyOutContent.classList.remove('animate');
    void flyOutContent.offsetWidth; 
    flyOutContent.classList.add('animate');
}

function updateProgress() {
    if (!body.classList.contains('is-post-page')) return;
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    if (height > 0) {
        const scrolled = Math.min(100, Math.max(0, Math.round((winScroll / height) * 100)));
        readingBar.style.width = scrolled + "%";
        readingCounter.textContent = scrolled + "%";

        const points = Object.keys(dynamicMessages);
        points.forEach(point => {
            if (scrolled >= parseInt(point) && !memory.triggeredMilestones.has(point)) {
                memory.triggeredMilestones.add(point);
                triggerFlyOut(point);
            }
        });
    }
}

function getRouteInfo() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p.length > 0);
    return { slug: pathParts[0] || null, chapterNum: pathParts[1] || "1" };
}

async function loadHomePage(query = '', reset = true) {
    window.renderComplete = false;
    if (reset && query === '' && memory.galleryItems.length > 0) {
        renderGallery(memory.galleryItems, false);
        loadMoreContainer.style.display = memory.hasMore ? 'block' : 'none';
        window.renderComplete = true;
        return; 
    }
    if (reset) {
        memory.currentOffset = 0;
        homeGallery.innerHTML = '<div class="spa-loader">Summoning the books... they are pretending they did not see you coming....</div>';
    }
    const { data, hasMore } = await fetchGalleryItems(query, memory.currentOffset);
    if (query === '') {
        if (reset) memory.galleryItems = data;
        else memory.galleryItems = [...memory.galleryItems, ...data];
    }
    await renderGallery(data, !reset);
    memory.hasMore = hasMore;
    loadMoreContainer.style.display = hasMore ? 'block' : 'none';
    if (hasMore && data) memory.currentOffset += data.length;
    currentSearchQuery = query;
    window.renderComplete = true;
}

const whatsappBtn = document.getElementById('whatsappBtn');
const whatsappModal = document.getElementById('whatsappModal');
const closeWhatsappModal = document.getElementById('closeWhatsappModal');
const coffeeBtn = document.getElementById('coffeeBtn');
const coffeeModal = document.getElementById('coffeeModal');
const closeCoffeeModal = document.getElementById('closeCoffeeModal');
const shareBtn = document.getElementById('shareBtn');
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const shareLinkDisplay = document.getElementById('shareLinkDisplay');
const copyLinkBtn = document.getElementById('copyLinkBtn');

if(whatsappBtn) whatsappBtn.addEventListener('click', (e) => { e.stopPropagation(); whatsappModal.classList.add('active'); });
if(closeWhatsappModal) closeWhatsappModal.addEventListener('click', () => { whatsappModal.classList.remove('active'); });
if(coffeeBtn) coffeeBtn.addEventListener('click', (e) => { e.stopPropagation(); coffeeModal.classList.add('active'); });
if(closeCoffeeModal) closeCoffeeModal.addEventListener('click', () => { coffeeModal.classList.remove('active'); });
if(shareBtn) shareBtn.addEventListener('click', (e) => { e.stopPropagation(); if(shareLinkDisplay) shareLinkDisplay.textContent = window.location.href; shareModal.classList.add('active'); });
if(closeShareModal) closeShareModal.addEventListener('click', () => { shareModal.classList.remove('active'); });
if(copyLinkBtn) copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareLinkDisplay.textContent).then(() => { copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!'; setTimeout(() => { copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Link'; }, 2000); });
});

window.addEventListener('popstate', handleRoute); 
window.addEventListener('scroll', updateProgress, { passive: true });

if(brandNameLink) brandNameLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.location.pathname !== '/') { window.history.pushState({}, '', '/'); handleRoute(); }
});

if(closeIconWrapper) closeIconWrapper.addEventListener('click', () => {
    const route = getRouteInfo();
    if (route.slug) { window.history.pushState({}, '', '/'); handleRoute(); }
    else if (searchContainer.classList.contains('active')) { toggleSearch(false); }
});

if(searchIcon) searchIcon.addEventListener('click', () => {
    if (searchInput.value.length > 0) {
        searchInput.value = '';
        searchIconI.className = 'fas fa-search';
        loadHomePage('', true);
    } else if (!getRouteInfo().slug) { toggleSearch(true); }
});

function toggleSearch(expand) {
    searchContainer.classList.toggle('active', expand);
    if (expand) { setTimeout(() => searchInput.focus(), 150); }
    else { loadHomePage(''); }
}

if(searchInput) searchInput.addEventListener('input', (e) => {
    if (e.target.value.length > 0) { searchIconI.className = 'fas fa-times-circle'; }
    else { searchIconI.className = 'fas fa-search'; }
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => { loadHomePage(e.target.value, true); }, 600);
});

if(loadMoreButton) loadMoreButton.addEventListener('click', () => loadHomePage(currentSearchQuery, false));

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch affiliate scripts globally first so they are always ready
    try {
        const { data: scriptData, error: scriptError } = await supabase.from('affiliate_scripts').select('*');
        if (!scriptError && scriptData) {
            memory.libraryScripts = scriptData;
        }
    } catch (err) {
        console.error('Failed to load global script library:', err);
    }
    
    handleRoute();
});

     
