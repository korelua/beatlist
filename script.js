// Beat data structure - Add your beats here
const beats = [
    {
        id: 1,
        title: "Griselda",
        originalPrice: 100,
        price: 50,
        audioUrl: "public/beats/griselda.wav",
        bpm: "90 BPM",
        key: "C min",
        genre: "Hip-Hop",
    },
    {
        id: 2,
        title: "Harp shit",
        originalPrice: 100,
        price: 50,
        audioUrl: "public/beats/harp.wav",
        bpm: "unknown BPM",
        key: "unknown key",
        genre: "Hip-Hop",
    },
    {
        id: 3,
        title: "Runtz",
        originalPrice: 100,
        price: 50,
        audioUrl: "public/beats/runtz.wav",
        bpm: "77 BPM",
        key: " D# min",
        genre: "Hip-Hop",
    },  
    {
        id: 4,
        title: "Spacedrop",
        originalPrice: 100,
        price: 50,
        audioUrl: "public/beats/spacedrop.wav",
        bpm: "120 BPM",
        key: "D# min",
        genre: "Trap",
    },
    {
        id: 5,
        title: "blooming",
        originalPrice: 100,
        price: 50,
        audioUrl: "public/beats/blooming.wav",
        bpm: "130 BPM",
        key: "D min",
        genre: "R&B",
    },
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
    const beat = beats.find(b => b.id === selectedBeatId);
    if (beat) {
        // Calculate the final price based on the license type
        let finalPrice;
        switch(license) {
            case 'Unlimited':
                finalPrice = beat.price; // Full price for unlimited license
                break;
            case 'Limited':
                finalPrice = beat.price * 0.5; // 50% of full price for limited license
                break;
            case 'MP3':
                finalPrice = beat.price * 0.2; // 20% of full price for MP3 license
                break;
            default:
                finalPrice = beat.price;
        }
        
        cart.push({ 
            ...beat, 
            license, 
            price: finalPrice,
            displayPrice: `$${finalPrice.toFixed(2)} (${license})`
        });
        updateCart();
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification(`Beat added to cart! (${license} license)`);
    }
    closeLicenseModal();
}

// Audio Services Add to Cart (with file upload modal)
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.license-option').forEach(btn => {
        btn.addEventListener('click', handleLicenseOption);
    });
    document.querySelector('.license-close').addEventListener('click', closeLicenseModal);

    // Add to cart for audio services (no file upload)
    document.querySelectorAll('.audio-service-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const service = btn.getAttribute('data-service');
            let price = 0;
            let displayPrice = '';
            if (service === 'Mix') {
                price = 100;
                displayPrice = '$100 (Mix)';
            } else if (service === 'Master') {
                price = 100;
                displayPrice = '$100 (Master)';
            } else if (service === 'Mix & Master') {
                price = 150;
                displayPrice = '$150 (Mix & Master)';
            }
            cart.push({
                id: `service-${service}`,
                title: service,
                license: 'Service',
                price: price,
                displayPrice: displayPrice
            });
            updateCart();
            localStorage.setItem('cart', JSON.stringify(cart));
            showNotification(`${service} added to cart!`);
        });
    });
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
        <div class="genre-section"${genre === 'Hip-Hop' ? ' id="hiphop-beats"' : ''}>
            <h2 class="genre-title">${genre}</h2>
            <div class="genre-beats">
                ${genreBeats.map(beat => `
                    <div class="beat-item">
                        <div class="beat-preview">
                            <div class="beat-info">
                                <h3 class="beat-title">${beat.title}</h3>
                                <p class="beat-details">${beat.bpm} | ${beat.key}</p>
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
                        <div class="beat-sale-pricing">
                            <span class="beat-old-price">$${beat.originalPrice.toFixed(2)}</span>
                            <span class="beat-sale-arrow">→</span>
                            <span class="beat-sale-price sale-animate">$${beat.price.toFixed(2)}</span>
                            <span class="beat-sale-badge">50% OFF</span>
                        </div>
                        <div class="license-buttons-container">
                            <button class="add-to-cart-button">Add to Cart</button>
                            <div class="license-buttons">
                                <button class="license-btn unlimited" onclick="addToCart(${beat.id}, 'Unlimited', ${beat.price})">
                                    <span class="license-name">UNLIMITED</span>
                                    <span class="license-details">ALL RIGHTS</span>
                                    <span class="license-price">$${beat.price}</span>
                                </button>
                                <button class="license-btn limited" onclick="addToCart(${beat.id}, 'Limited', ${(beat.price * 0.5).toFixed(2)})">
                                    <span class="license-name">LIMITED</span>
                                    <span class="license-details">100K streams</span>
                                    <span class="license-price">$${(beat.price * 0.5).toFixed(2)}</span>
                                </button>
                                <button class="license-btn mp3" onclick="addToCart(${beat.id}, 'MP3', ${(beat.price * 0.2).toFixed(2)})">
                                    <span class="license-name">MP3</span>
                                    <span class="license-details">10K streams</span>
                                    <span class="license-price">$${(beat.price * 0.2).toFixed(2)}</span>
                                </button>
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
        const beatItem = player.closest('.beat-item');
        const audio = new Audio(player.getAttribute('data-src'));
        
        // Get the BPM value and calculate animation duration
        let bpmValue = 120; // Default BPM if not specified
        const bpmText = beatItem.querySelector('.beat-details').textContent;
        if (bpmText) {
            // Extract BPM number from text like "90 BPM | C min"
            const bpmMatch = bpmText.match(/(\d+)\s*BPM/i);
            if (bpmMatch && bpmMatch[1]) {
                bpmValue = parseInt(bpmMatch[1]);
            }
        }
        
        // Calculate animation duration: slower BPM = longer duration
        // Formula: 60 seconds / BPM * beats per animation cycle
        // Using 4 beats per animation cycle for a more dramatic effect
        const animationDuration = (60 / bpmValue) * 4;
        
        // Set custom animation duration as data attribute
        beatItem.style.setProperty('--beat-animation-duration', `${animationDuration}s`);

        let isPlaying = false;

        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
                // Remove playing class
                beatItem.classList.remove('beat-playing');
            } else {
                // Pause all other custom players
                document.querySelectorAll('.custom-audio-player').forEach(p => {
                    if (p !== player) {
                        p.audio && p.audio.pause();
                        // Remove playing class from other beat items
                        const otherBeatItem = p.closest('.beat-item');
                        if (otherBeatItem) {
                            otherBeatItem.classList.remove('beat-playing');
                        }
                    }
                });
                audio.play();
                // Add playing class to trigger CSS animations
                beatItem.classList.add('beat-playing');
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
            // Remove playing class
            beatItem.classList.remove('beat-playing');
        });

        audio.addEventListener('ended', () => {
            isPlaying = false;
            playBtn.classList.remove('playing');
            playBtn.classList.add('paused');
            audio.currentTime = 0;
            progress.style.width = '0%';
            // Remove playing class
            beatItem.classList.remove('beat-playing');
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
            <span>${item.displayPrice}</span>
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
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
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
    console.log('Cart before checkout:', cart);
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    // Ensure cart is saved to localStorage
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Cart saved before checkout:', cart);
        // Redirect to checkout page
        window.location.href = 'checkout.html';
    } catch (error) {
        console.error('Error saving cart:', error);
        showNotification('Error saving cart. Please try again.');
    }
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
        <div class="genre-section"${genre === 'Hip-Hop' ? ' id="hiphop-beats"' : ''}>
            <h2 class="genre-title">${genre}</h2>
            <div class="genre-beats">
                ${genreBeats.map(beat => `
                    <div class="beat-item">
                        <div class="beat-preview">
                            <div class="beat-info">
                                <h3 class="beat-title">${beat.title}</h3>
                                <p class="beat-details">${beat.bpm} | ${beat.key}</p>
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
                        <div class="beat-sale-pricing">
                            <span class="beat-old-price">$${beat.originalPrice.toFixed(2)}</span>
                            <span class="beat-sale-arrow">→</span>
                            <span class="beat-sale-price sale-animate">$${beat.price.toFixed(2)}</span>
                            <span class="beat-sale-badge">50% OFF</span>
                        </div>
                        <div class="license-buttons-container">
                            <button class="add-to-cart-button">Add to Cart</button>
                            <div class="license-buttons">
                                <button class="license-btn unlimited" onclick="addToCart(${beat.id}, 'Unlimited', ${beat.price})">
                                    <span class="license-name">UNLIMITED</span>
                                    <span class="license-details">ALL RIGHTS</span>
                                    <span class="license-price">$${beat.price}</span>
                                </button>
                                <button class="license-btn limited" onclick="addToCart(${beat.id}, 'Limited', ${(beat.price * 0.5).toFixed(2)})">
                                    <span class="license-name">LIMITED</span>
                                    <span class="license-details">100K streams</span>
                                    <span class="license-price">$${(beat.price * 0.5).toFixed(2)}</span>
                                </button>
                                <button class="license-btn mp3" onclick="addToCart(${beat.id}, 'MP3', ${(beat.price * 0.2).toFixed(2)})">
                                    <span class="license-name">MP3</span>
                                    <span class="license-details">10K streams</span>
                                    <span class="license-price">$${(beat.price * 0.2).toFixed(2)}</span>
                                </button>
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

// Add to cart directly from license buttons
function addToCart(beatId, license, price) {
    const beat = beats.find(b => b.id === beatId);
    if (beat) {
        // Calculate the final price based on the license type
        let finalPrice;
        switch(license) {
            case 'Unlimited':
                finalPrice = beat.price; // Full price for unlimited license
                break;
            case 'Limited':
                finalPrice = beat.price * 0.5; // 50% of full price for limited license
                break;
            case 'MP3':
                finalPrice = beat.price * 0.2; // 20% of full price for MP3 license
                break;
            default:
                finalPrice = beat.price;
        }
        
        cart.push({ 
            ...beat, 
            license, 
            price: finalPrice,
            displayPrice: `$${finalPrice.toFixed(2)} (${license})`
        });
        updateCart();
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification(`Beat added to cart! (${license} license)`);
    }
}

// Initialize the display
displayBeats();

// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileSearchInput = document.querySelector('.mobile-search input');
    const mobileGenreFilter = document.getElementById('mobile-genre-filter');
    const mobileBpmFilter = document.getElementById('mobile-bpm-filter');
    const mobileKeyFilter = document.getElementById('mobile-key-filter');

    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
        mobileMenuBtn.querySelector('i').classList.toggle('fa-bars');
        mobileMenuBtn.querySelector('i').classList.toggle('fa-times');
    });

    // Sync mobile search with main search
    mobileSearchInput.addEventListener('input', function(e) {
        document.getElementById('search-input').value = e.target.value;
        filterBeats();
    });

    // Sync mobile filters with main filters
    mobileGenreFilter.addEventListener('change', function(e) {
        document.getElementById('genre-filter').value = e.target.value;
        filterBeats();
    });

    mobileBpmFilter.addEventListener('change', function(e) {
        document.getElementById('bpm-filter').value = e.target.value;
        filterBeats();
    });

    mobileKeyFilter.addEventListener('change', function(e) {
        document.getElementById('key-filter').value = e.target.value;
        filterBeats();
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            mobileMenuBtn.querySelector('i').classList.remove('fa-times');
        }
    });

    // Prevent body scroll when mobile menu is open
    mobileMenuBtn.addEventListener('click', function() {
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });
});

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        
        try {
            // Disable the submit button and show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('There was an error sending your message. Please try again later.', 'error');
        } finally {
            // Re-enable the submit button and restore original text
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
} 