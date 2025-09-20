// Global state management
let currentUser = null;
let categories = [];
let auctions = [];
let users = [];
let settings = {
    defaultAuctionDuration: 7,
    minBidIncrement: 1,
    emailNotifications: true,
    autoAward: true
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDashboard();
    loadCategories();
    loadAuctions();
    loadUsers();
    startAuctionTimer();
    
    // Initialize login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('auctionForm').addEventListener('submit', handleCreateAuction);
    
    // Show home section by default
    showSection('home');
});

// Data persistence functions
function saveData() {
    localStorage.setItem('auctionSystem', JSON.stringify({
        categories,
        auctions,
        users,
        settings,
        currentUser
    }));
}

function loadData() {
    const data = localStorage.getItem('auctionSystem');
    if (data) {
        const parsed = JSON.parse(data);
        categories = parsed.categories || [];
        auctions = parsed.auctions || [];
        users = parsed.users || [];
        settings = parsed.settings || settings;
        currentUser = parsed.currentUser || null;
    } else {
        // Initialize with default data
        initializeDefaultData();
    }
    
    updateLoginButton();
}

function initializeDefaultData() {
    // Default users
    users = [
        { id: 1, username: 'admin', password: 'admin', role: 'admin', email: 'admin@auction.com' },
        { id: 2, username: 'user', password: 'user', role: 'user', email: 'user@auction.com' }
    ];
    
    // Default categories
    categories = [
        { id: 1, name: 'Electronics', count: 0 },
        { id: 2, name: 'Art & Collectibles', count: 0 },
        { id: 3, name: 'Vehicles', count: 0 },
        { id: 4, name: 'Home & Garden', count: 0 }
    ];
    
    // Sample auctions
    const now = new Date();
    const endTime1 = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now
    const endTime2 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    
    auctions = [
        {
            id: 1,
            title: 'Vintage Guitar',
            description: 'Beautiful vintage acoustic guitar in excellent condition',
            startingPrice: 500,
            currentPrice: 750,
            endTime: endTime1.toISOString(),
            category: 'Art & Collectibles',
            bids: [
                { userId: 2, amount: 600, timestamp: new Date(now.getTime() - 60000).toISOString() },
                { userId: 1, amount: 750, timestamp: new Date().toISOString() }
            ],
            status: 'active',
            createdBy: 1
        },
        {
            id: 2,
            title: 'Gaming Laptop',
            description: 'High-performance gaming laptop with RTX graphics',
            startingPrice: 1000,
            currentPrice: 1200,
            endTime: endTime2.toISOString(),
            category: 'Electronics',
            bids: [
                { userId: 1, amount: 1100, timestamp: new Date(now.getTime() - 120000).toISOString() },
                { userId: 2, amount: 1200, timestamp: new Date(now.getTime() - 60000).toISOString() }
            ],
            status: 'active',
            createdBy: 2
        }
    ];
    
    saveData();
}

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Load section-specific data
    switch(sectionId) {
        case 'home':
            updateDashboard();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'bidding':
            loadAuctions();
            loadCategoryOptions();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'admin':
            if (currentUser && currentUser.role === 'admin') {
                loadAdminSection();
            } else {
                alert('Admin access required');
                showSection('home');
            }
            break;
    }
}

// Login functions
function toggleLogin() {
    if (currentUser) {
        logout();
    } else {
        document.getElementById('loginModal').style.display = 'block';
    }
}

function closeLogin() {
    document.getElementById('loginModal').style.display = 'none';
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        saveData();
        updateLoginButton();
        closeLogin();
        showSection('home');
        document.getElementById('loginForm').reset();
    } else {
        alert('Invalid credentials');
    }
}

function logout() {
    currentUser = null;
    saveData();
    updateLoginButton();
    showSection('home');
}

function updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (currentUser) {
        loginBtn.textContent = `Logout (${currentUser.username})`;
    } else {
        loginBtn.textContent = 'Login';
    }
}

// Dashboard functions
function updateDashboard() {
    const activeAuctionsCount = auctions.filter(a => a.status === 'active').length;
    const totalCategoriesCount = categories.length;
    const totalUsersCount = users.length;
    const todaysBidsCount = getTodaysBidsCount();
    
    document.getElementById('activeAuctions').textContent = activeAuctionsCount;
    document.getElementById('totalCategories').textContent = totalCategoriesCount;
    document.getElementById('totalUsers').textContent = totalUsersCount;
    document.getElementById('todaysBids').textContent = todaysBidsCount;
}

function getTodaysBidsCount() {
    const today = new Date().toDateString();
    let count = 0;
    auctions.forEach(auction => {
        auction.bids.forEach(bid => {
            if (new Date(bid.timestamp).toDateString() === today) {
                count++;
            }
        });
    });
    return count;
}

// Category management functions
function loadCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-item';
        categoryDiv.innerHTML = `
            <h4>${category.name}</h4>
            <p>${category.count || 0} auctions</p>
            <button onclick="deleteCategory(${category.id})" style="background: var(--danger); margin-top: 0.5rem;">Delete</button>
        `;
        container.appendChild(categoryDiv);
    });
}

function addCategory() {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) {
        alert('Please enter a category name');
        return;
    }
    
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert('Category already exists');
        return;
    }
    
    const newCategory = {
        id: Date.now(),
        name: name,
        count: 0
    };
    
    categories.push(newCategory);
    saveData();
    loadCategories();
    updateDashboard();
    document.getElementById('categoryName').value = '';
}

function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        categories = categories.filter(c => c.id !== id);
        saveData();
        loadCategories();
        updateDashboard();
    }
}

// Auction functions
function loadAuctions() {
    const container = document.getElementById('auctionsList');
    container.innerHTML = '';
    
    auctions.forEach(auction => {
        const auctionDiv = document.createElement('div');
        auctionDiv.className = 'auction-item';
        
        const endTime = new Date(auction.endTime);
        const now = new Date();
        const timeLeft = endTime - now;
        const isEnded = timeLeft <= 0;
        
        if (isEnded && auction.status === 'active') {
            auction.status = 'ended';
            if (settings.autoAward && auction.bids.length > 0) {
                awardAuction(auction);
            }
        }
        
        const statusBadge = `<span class="status-badge status-${auction.status}">${auction.status.toUpperCase()}</span>`;
        const timeLeftStr = isEnded ? 'Ended' : formatTimeLeft(timeLeft);
        
        auctionDiv.innerHTML = `
            <div class="auction-title">${auction.title}</div>
            <p>${auction.description}</p>
            <div class="auction-price">Current Bid: $${auction.currentPrice}</div>
            <p>Category: ${auction.category}</p>
            <p>Time Left: ${timeLeftStr}</p>
            ${statusBadge}
            <div class="bid-input">
                <input type="number" id="bid-${auction.id}" placeholder="Enter bid amount" 
                       min="${auction.currentPrice + settings.minBidIncrement}" 
                       ${isEnded ? 'disabled' : ''}>
                <button onclick="placeBid(${auction.id})" ${isEnded ? 'disabled' : ''}>
                    ${isEnded ? 'Ended' : 'Place Bid'}
                </button>
            </div>
            <div style="margin-top: 1rem;">
                <strong>Bid History:</strong>
                <div style="max-height: 100px; overflow-y: auto; margin-top: 0.5rem;">
                    ${auction.bids.map(bid => {
                        const user = users.find(u => u.id === bid.userId);
                        return `<div style="font-size: 0.9rem; margin-bottom: 0.25rem;">
                            $${bid.amount} by ${user ? user.username : 'Unknown'} 
                            (${new Date(bid.timestamp).toLocaleString()})
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
        
        container.appendChild(auctionDiv);
    });
    
    saveData();
}

function loadCategoryOptions() {
    const select = document.getElementById('auctionCategory');
    select.innerHTML = '<option value="">Select Category</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function showAddAuctionForm() {
    if (!currentUser) {
        alert('Please login to create an auction');
        return;
    }
    document.getElementById('addAuctionForm').style.display = 'block';
}

function hideAddAuctionForm() {
    document.getElementById('addAuctionForm').style.display = 'none';
    document.getElementById('auctionForm').reset();
}

function handleCreateAuction(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to create an auction');
        return;
    }
    
    const title = document.getElementById('auctionTitle').value;
    const description = document.getElementById('auctionDescription').value;
    const startingPrice = parseFloat(document.getElementById('startingPrice').value);
    const endTime = document.getElementById('endTime').value;
    const category = document.getElementById('auctionCategory').value;
    
    const newAuction = {
        id: Date.now(),
        title,
        description,
        startingPrice,
        currentPrice: startingPrice,
        endTime,
        category,
        bids: [],
        status: 'active',
        createdBy: currentUser.id
    };
    
    auctions.push(newAuction);
    
    // Update category count
    const cat = categories.find(c => c.name === category);
    if (cat) {
        cat.count++;
    }
    
    saveData();
    loadAuctions();
    hideAddAuctionForm();
    updateDashboard();
}

function placeBid(auctionId) {
    if (!currentUser) {
        alert('Please login to place a bid');
        return;
    }
    
    const auction = auctions.find(a => a.id === auctionId);
    const bidInput = document.getElementById(`bid-${auctionId}`);
    const bidAmount = parseFloat(bidInput.value);
    
    if (!bidAmount || bidAmount <= auction.currentPrice) {
        alert(`Bid must be higher than current price of $${auction.currentPrice}`);
        return;
    }
    
    if (bidAmount < auction.currentPrice + settings.minBidIncrement) {
        alert(`Minimum bid increment is $${settings.minBidIncrement}`);
        return;
    }
    
    const bid = {
        userId: currentUser.id,
        amount: bidAmount,
        timestamp: new Date().toISOString()
    };
    
    auction.bids.push(bid);
    auction.currentPrice = bidAmount;
    
    saveData();
    loadAuctions();
    bidInput.value = '';
}

function awardAuction(auction) {
    if (auction.bids.length === 0) return;
    
    const highestBid = auction.bids.reduce((max, bid) => 
        bid.amount > max.amount ? bid : max
    );
    
    const winner = users.find(u => u.id === highestBid.userId);
    auction.winner = winner ? winner.username : 'Unknown';
    auction.winningBid = highestBid.amount;
}

function formatTimeLeft(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Analytics functions
function loadAnalytics() {
    loadRevenueChart();
    loadActivityChart();
    loadCategoryStats();
    loadRecentActivity();
}

function loadRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    const ctx = canvas.getContext('2d');
    
    // Simple chart drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4169E1';
    ctx.font = '16px Arial';
    ctx.fillText('Revenue Over Time', 10, 30);
    
    // Draw sample bars
    const data = [100, 150, 200, 180, 220, 250, 300];
    const barWidth = 40;
    const maxHeight = 120;
    
    data.forEach((value, index) => {
        const height = (value / 300) * maxHeight;
        const x = 20 + index * 50;
        const y = canvas.height - height - 40;
        
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(x, y, barWidth, height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(`$${value}`, x + 5, y - 5);
    });
}

function loadActivityChart() {
    const canvas = document.getElementById('activityChart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4169E1';
    ctx.font = '16px Arial';
    ctx.fillText('User Activity', 10, 30);
    
    // Draw sample line chart
    const data = [20, 35, 25, 45, 38, 42, 50];
    ctx.strokeStyle = '#4169E1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = 20 + index * 50;
        const y = canvas.height - (value * 2) - 40;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw points
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 2, y - 2, 4, 4);
    });
    
    ctx.stroke();
}

function loadCategoryStats() {
    const container = document.getElementById('categoryStats');
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryAuctions = auctions.filter(a => a.category === category.name);
        const totalValue = categoryAuctions.reduce((sum, auction) => sum + auction.currentPrice, 0);
        
        const statDiv = document.createElement('div');
        statDiv.style.marginBottom = '1rem';
        statDiv.innerHTML = `
            <strong>${category.name}</strong><br>
            Auctions: ${categoryAuctions.length}<br>
            Total Value: $${totalValue.toLocaleString()}
        `;
        container.appendChild(statDiv);
    });
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    
    const recentBids = [];
    auctions.forEach(auction => {
        auction.bids.forEach(bid => {
            const user = users.find(u => u.id === bid.userId);
            recentBids.push({
                ...bid,
                auctionTitle: auction.title,
                userName: user ? user.username : 'Unknown'
            });
        });
    });
    
    recentBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentBids.slice(0, 5).forEach(activity => {
        const activityDiv = document.createElement('div');
        activityDiv.style.marginBottom = '1rem';
        activityDiv.style.fontSize = '0.9rem';
        activityDiv.innerHTML = `
            <strong>${activity.userName}</strong> bid $${activity.amount}<br>
            on "${activity.auctionTitle}"<br>
            <small>${new Date(activity.timestamp).toLocaleString()}</small>
        `;
        container.appendChild(activityDiv);
    });
}

// Settings functions
function loadSettings() {
    document.getElementById('defaultAuctionDuration').value = settings.defaultAuctionDuration;
    document.getElementById('minBidIncrement').value = settings.minBidIncrement;
    document.getElementById('emailNotifications').checked = settings.emailNotifications;
    document.getElementById('autoAward').checked = settings.autoAward;
}

function saveAuctionSettings() {
    settings.defaultAuctionDuration = parseInt(document.getElementById('defaultAuctionDuration').value);
    settings.minBidIncrement = parseFloat(document.getElementById('minBidIncrement').value);
    saveData();
    alert('Auction settings saved successfully');
}

function saveSystemSettings() {
    settings.emailNotifications = document.getElementById('emailNotifications').checked;
    settings.autoAward = document.getElementById('autoAward').checked;
    saveData();
    alert('System settings saved successfully');
}

// Admin functions
function loadAdminSection() {
    loadValidityDates();
}

function showUserManagement() {
    const userManagement = document.getElementById('userManagement');
    userManagement.style.display = userManagement.style.display === 'none' ? 'block' : 'none';
    if (userManagement.style.display === 'block') {
        loadUsers();
    }
}

function loadUsers() {
    const container = document.getElementById('usersList');
    container.innerHTML = '';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <div>
                <strong>${user.username}</strong> (${user.role})<br>
                <small>${user.email}</small>
            </div>
            <button onclick="deleteUser(${user.id})" style="background: var(--danger);">Delete</button>
        `;
        container.appendChild(userDiv);
    });
}

function addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const role = document.getElementById('newUserRole').value;
    
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    
    if (users.find(u => u.username === username)) {
        alert('Username already exists');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        username,
        password,
        role,
        email: `${username}@auction.com`
    };
    
    users.push(newUser);
    saveData();
    loadUsers();
    updateDashboard();
    
    // Clear form
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newUserRole').value = 'user';
}

function deleteUser(id) {
    if (currentUser && currentUser.id === id) {
        alert('Cannot delete your own account');
        return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(u => u.id !== id);
        saveData();
        loadUsers();
        updateDashboard();
    }
}

function loadValidityDates() {
    const systemValidity = localStorage.getItem('systemValidity');
    const subscriptionValidity = localStorage.getItem('subscriptionValidity');
    
    if (systemValidity) {
        document.getElementById('systemValidity').value = systemValidity;
    }
    if (subscriptionValidity) {
        document.getElementById('subscriptionValidity').value = subscriptionValidity;
    }
}

function saveValidityDates() {
    const systemValidity = document.getElementById('systemValidity').value;
    const subscriptionValidity = document.getElementById('subscriptionValidity').value;
    
    localStorage.setItem('systemValidity', systemValidity);
    localStorage.setItem('subscriptionValidity', subscriptionValidity);
    
    alert('Validity dates saved successfully');
}

function clearAuctions() {
    if (confirm('Are you sure you want to clear all completed auctions?')) {
        auctions = auctions.filter(a => a.status === 'active');
        saveData();
        loadAuctions();
        updateDashboard();
        alert('Completed auctions cleared');
    }
}

function exportData() {
    const data = {
        categories,
        auctions,
        users: users.map(u => ({ ...u, password: undefined })), // Remove passwords
        settings,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-system-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function resetSystem() {
    if (confirm('Are you sure you want to reset the entire system? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
    }
}

// Timer for auction updates
function startAuctionTimer() {
    setInterval(() => {
        loadAuctions();
        updateDashboard();
    }, 60000); // Update every minute
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeLogin();
    }
}