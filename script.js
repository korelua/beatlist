// Beat data structure - Add your beats here
const beats = [
    {
        id: 1,
        title: "Griselda",
        price: 19.99,
        audioUrl: "C:/Users/KORE/Desktop/BEATS/28 - griselda freestyle tpe beat (90 bpm C min).wav",
        bpm: "90 BPM",
        key: "C min",
        genre: "Hip-Hop"
    },
    {
        id: 2,
        title: "Harp shit",
        price: 19.99,
        audioUrl: "C:/Users/KORE/Desktop/BEATS/Harp - hop !.wav",
        bpm: "unknown BPM",
        key: "unknown key",
        genre: "Hip-Hop"
    }
    // Add more beats following the same structure
    // Example:
    // {
    //     id: 2,
    //     title: "Another Beat",
    //     price: 34.99,
    //     audioUrl: "beats/another-beat.mp3",
    //     imageUrl: "images/another-cover.jpg"
    // }
];

// Shopping cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const beatsGrid = document.querySelector('.beats-grid');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartIcon = document.querySelector('.cart-icon');
const closeModal = document.querySelector('.close');
const checkoutBtn = document.getElementById('checkout-btn');

// Show license modal and handle selection
let selectedBeatId = null;
function showLicenseModal(beatId, event) {
    selectedBeatId = beatId;
    const modal = document.getElementById('license-modal');
    const modalContent = modal.querySelector('.license-modal-content');
    
    // Calculate position
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    
    if (event && event.target) {
        const rect = event.target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + window.scrollY - 100; // Position it higher
        
        // Ensure modal stays within viewport
        const modalHeight = 300; // Approximate modal height
        if (y < window.scrollY + 20) {
            y = window.scrollY + 20;
        }
    }
    
    modal.style.setProperty('--modal-x', `${x}px`);
    modal.style.setProperty('--modal-y', `${y}px`);
    modal.classList.add('active');
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

function closeLicenseModal() {
    const modal = document.getElementById('license-modal');
    modal.classList.remove('active');
    selectedBeatId = null;
    // Restore body scrolling
    document.body.style.overflow = '';
}

// Handle license selection
function handleLicenseOption(e) {
    if (!selectedBeatId) return;
    const license = e.target.getAttribute('data-license');
    const price = parseFloat(e.target.getAttribute('data-price'));
    const beat = beats.find(b => b.id === selectedBeatId);
    if (beat) {
        cart.push({ ...beat, license, price });
        updateCart();
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification(`Beat added to cart! (${license} license)`);
    }
    closeLicenseModal();
}

// Attach modal events after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.license-option').forEach(btn => {
        btn.addEventListener('click', handleLicenseOption);
    });
    document.querySelector('.license-close').addEventListener('click', closeLicenseModal);
});

// Display beats
function displayBeats() {
    // Group beats by genre
    const beatsByGenre = beats.reduce((acc, beat) => {
        if (!acc[beat.genre]) {
            acc[beat.genre] = [];
        }
        acc[beat.genre].push(beat);
        return acc;
    }, {});

    // Create HTML for each genre section
    beatsGrid.innerHTML = Object.entries(beatsByGenre).map(([genre, genreBeats]) => `
        <div class="genre-section">
            <h2 class="genre-title">${genre}</h2>
            <div class="genre-beats">
                ${genreBeats.map(beat => `
                    <div class="beat-item">
                        <div class="beat-preview">
                            <div class="beat-info">
                                <h3 class="beat-title">${beat.title}</h3>
                                <p class="beat-details">${beat.bpm} | ${beat.key}</p>
                                <p class="beat-price">$${beat.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <div class="custom-audio-player" data-src="${beat.audioUrl}">
                            <button class="custom-play-btn paused"></button>
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress"></div>
                                </div>
                            </div>
                        </div>
                        <div class="add-to-cart-container">
                            <button class="add-to-cart" onclick="showLicenseModal(${beat.id}, event)">
                                Add to Cart
                            </button>
                            <div class="license-modal-content">
                                <span class="license-close">&times;</span>
                                <h2>Select License</h2>
                                <div id="license-options">
                                    <button class="license-option" data-license="Unlimited" data-price="100">Unlimited (WAV, all rights) - $100</button>
                                    <button class="license-option" data-license="Limited" data-price="50">Limited (WAV, up to 100k streams) - $50</button>
                                    <button class="license-option" data-license="MP3" data-price="20">MP3 (up to 10k streams) - $20</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Initialize audio players
    initializeAudioPlayers();
}

function initializeAudioPlayers() {
    document.querySelectorAll('.custom-audio-player').forEach(player => {
        const playBtn = player.querySelector('.custom-play-btn');
        const progressBar = player.querySelector('.progress-bar');
        const progress = player.querySelector('.progress');
        const audio = new Audio(player.getAttribute('data-src'));

        let isPlaying = false;

        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
            } else {
                // Pause all other custom players
                document.querySelectorAll('.custom-audio-player').forEach(p => {
                    if (p !== player) {
                        p.audio && p.audio.pause();
                    }
                });
                audio.play();
            }
        });

        audio.addEventListener('play', () => {
            isPlaying = true;
            playBtn.classList.add('playing');
            playBtn.classList.remove('paused');
        });

        audio.addEventListener('pause', () => {
            isPlaying = false;
            playBtn.classList.remove('playing');
            playBtn.classList.add('paused');
        });

        audio.addEventListener('ended', () => {
            isPlaying = false;
            playBtn.classList.remove('playing');
            playBtn.classList.add('paused');
            audio.currentTime = 0;
            progress.style.width = '0%';
        });

        audio.addEventListener('timeupdate', () => {
            const percent = (audio.currentTime / audio.duration) * 100;
            progress.style.width = percent + '%';
        });

        // Add click handler for seeking
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        });

        // Store audio on player for global pause
        player.audio = audio;
        playBtn.classList.add('paused');
    });
}

// Update cart
function updateCart() {
    // Update cart count
    cartCount.textContent = cart.length;

    // Update cart items
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.title} <span style='color:#ff0000;font-size:0.9em;'>[${item.license}]</span></span>
            <span>$${item.price.toFixed(2)}</span>
            <button onclick="removeFromCart(${index})">Remove</button>
        </div>
    `).join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = total.toFixed(2);
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    localStorage.setItem('cart', JSON.stringify(cart));
    showNotification('Beat removed from cart!');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Modal functionality
cartIcon.addEventListener('click', () => {
    cartModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

// Checkout functionality
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
});

// Smooth scroll to beats section
document.querySelector('.scroll-indicator').addEventListener('click', () => {
    const beatsSection = document.querySelector('.beats-section');
    beatsSection.scrollIntoView({ behavior: 'smooth' });
});

// Search and Filter functionality
const searchInput = document.getElementById('search-input');
const genreFilter = document.getElementById('genre-filter');
const bpmFilter = document.getElementById('bpm-filter');
const keyFilter = document.getElementById('key-filter');

function filterBeats() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedGenre = genreFilter.value;
    const selectedBpm = bpmFilter.value;
    const selectedKey = keyFilter.value;

    const filteredBeats = beats.filter(beat => {
        // Search term filter
        const matchesSearch = beat.title.toLowerCase().includes(searchTerm);

        // Genre filter
        const matchesGenre = !selectedGenre || beat.genre === selectedGenre;

        // BPM filter
        let matchesBpm = true;
        if (selectedBpm) {
            const bpm = parseInt(beat.bpm);
            switch (selectedBpm) {
                case '60-80':
                    matchesBpm = bpm >= 60 && bpm < 80;
                    break;
                case '80-100':
                    matchesBpm = bpm >= 80 && bpm < 100;
                    break;
                case '100-120':
                    matchesBpm = bpm >= 100 && bpm < 120;
                    break;
                case '120+':
                    matchesBpm = bpm >= 120;
                    break;
            }
        }

        // Key filter
        const matchesKey = !selectedKey || beat.key.includes(selectedKey);

        return matchesSearch && matchesGenre && matchesBpm && matchesKey;
    });

    // Update the display with filtered beats
    displayFilteredBeats(filteredBeats);
}

function displayFilteredBeats(filteredBeats) {
    // Group filtered beats by genre
    const beatsByGenre = filteredBeats.reduce((acc, beat) => {
        if (!acc[beat.genre]) {
            acc[beat.genre] = [];
        }
        acc[beat.genre].push(beat);
        return acc;
    }, {});

    // Create HTML for each genre section
    beatsGrid.innerHTML = Object.entries(beatsByGenre).map(([genre, genreBeats]) => `
        <div class="genre-section">
            <h2 class="genre-title">${genre}</h2>
            <div class="genre-beats">
                ${genreBeats.map(beat => `
                    <div class="beat-item">
                        <div class="beat-preview">
                            <div class="beat-info">
                                <h3 class="beat-title">${beat.title}</h3>
                                <p class="beat-details">${beat.bpm} | ${beat.key}</p>
                                <p class="beat-price">$${beat.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <div class="custom-audio-player" data-src="${beat.audioUrl}">
                            <button class="custom-play-btn paused"></button>
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress"></div>
                                </div>
                            </div>
                        </div>
                        <div class="add-to-cart-container">
                            <button class="add-to-cart" onclick="showLicenseModal(${beat.id}, event)">
                                Add to Cart
                            </button>
                            <div class="license-modal-content">
                                <span class="license-close">&times;</span>
                                <h2>Select License</h2>
                                <div id="license-options">
                                    <button class="license-option" data-license="Unlimited" data-price="100">Unlimited (WAV, all rights) - $100</button>
                                    <button class="license-option" data-license="Limited" data-price="50">Limited (WAV, up to 100k streams) - $50</button>
                                    <button class="license-option" data-license="MP3" data-price="20">MP3 (up to 10k streams) - $20</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Reinitialize audio players for filtered beats
    initializeAudioPlayers();
}

// Add event listeners for search and filter
searchInput.addEventListener('input', filterBeats);
genreFilter.addEventListener('change', filterBeats);
bpmFilter.addEventListener('change', filterBeats);
keyFilter.addEventListener('change', filterBeats);

// Initialize the display
displayBeats(); 