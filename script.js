// 冷蔵庫トラッカー - メインスクリプト

class FridgeTracker {
    constructor() {
        this.items = [];
        this.history = [];
        this.camera = null;
        this.currentStream = null;
        this.currentModal = null;
        this.currentItemId = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderItems();
        this.renderHistory();
        this.updateStats();
        
        // 今日の日付をデフォルトに設定
        const today = new Date().toISOString().split('T')[0];
        const purchaseDateInput = document.getElementById('purchase-date');
        if (purchaseDateInput) {
            purchaseDateInput.value = today;
        }
    }

    // データの読み込み
    loadData() {
        try {
            const savedItems = localStorage.getItem('fridgeItems');
            const savedHistory = localStorage.getItem('fridgeHistory');
            
            this.items = savedItems ? JSON.parse(savedItems) : [];
            this.history = savedHistory ? JSON.parse(savedHistory) : [];
            
            // 日付文字列をDateオブジェクトに変換
            this.items.forEach(item => {
                item.purchaseDate = new Date(item.purchaseDate);
                item.expiryDate = new Date(item.expiryDate);
                item.addedDate = new Date(item.addedDate);
            });
            
            this.history.forEach(entry => {
                entry.date = new Date(entry.date);
            });
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            this.items = [];
            this.history = [];
        }
    }

    // データの保存
    saveData() {
        try {
            localStorage.setItem('fridgeItems', JSON.stringify(this.items));
            localStorage.setItem('fridgeHistory', JSON.stringify(this.history));
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            this.showNotification('データの保存に失敗しました', 'error');
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // タブ切り替え
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // カメラ関連
        document.getElementById('start-camera')?.addEventListener('click', () => this.startCamera());
        document.getElementById('capture-photo')?.addEventListener('click', () => this.capturePhoto());
        document.getElementById('stop-camera')?.addEventListener('click', () => this.stopCamera());
        document.getElementById('receipt-file')?.addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('analyze-receipt')?.addEventListener('click', () => this.analyzeReceipt());
        document.getElementById('retake-photo')?.addEventListener('click', () => this.retakePhoto());

        // レシート解析
        document.getElementById('add-items')?.addEventListener('click', () => this.addSelectedItems());
        document.getElementById('manual-add')?.addEventListener('click', () => this.openManualAddModal());

        // フィルター
        document.getElementById('category-filter')?.addEventListener('change', () => this.renderItems());
        document.getElementById('status-filter')?.addEventListener('change', () => this.renderItems());
        document.getElementById('sort-btn')?.addEventListener('click', () => this.sortItems());
        document.getElementById('history-filter')?.addEventListener('change', () => this.renderHistory());
        document.getElementById('date-filter')?.addEventListener('change', () => this.renderHistory());

        // モーダル関連
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // タブ切り替え
    switchTab(tabName) {
        // ナビゲーションボタン
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // タブコンテンツ
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // カメラを停止
        if (tabName !== 'receipt') {
            this.stopCamera();
        }
    }

    // カメラ開始
    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            const video = document.getElementById('camera-video');
            video.srcObject = stream;
            this.currentStream = stream;
            
            document.getElementById('start-camera').disabled = true;
            document.getElementById('capture-photo').disabled = false;
            document.getElementById('stop-camera').disabled = false;
            
            this.showNotification('カメラを開始しました', 'success');
        } catch (error) {
            console.error('カメラの開始に失敗しました:', error);
            this.showNotification('カメラの開始に失敗しました', 'error');
        }
    }

    // 写真撮影
    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        this.displayCapturedImage(imageData);
        this.stopCamera();
    }

    // カメラ停止
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        document.getElementById('start-camera').disabled = false;
        document.getElementById('capture-photo').disabled = true;
        document.getElementById('stop-camera').disabled = true;
    }

    // ファイルアップロード処理
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.displayCapturedImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    // 撮影画像表示
    displayCapturedImage(imageData) {
        const capturedSection = document.getElementById('captured-image-section');
        const capturedImage = document.getElementById('captured-image');
        
        capturedImage.src = imageData;
        capturedSection.style.display = 'block';
        
        // 解析結果をリセット
        document.getElementById('analysis-results').style.display = 'none';
    }

    // 撮り直し
    retakePhoto() {
        document.getElementById('captured-image-section').style.display = 'none';
        document.getElementById('analysis-results').style.display = 'none';
        document.getElementById('receipt-file').value = '';
    }

    // レシート解析（簡易版）
    async analyzeReceipt() {
        const analysisSection = document.getElementById('analysis-results');
        const loading = document.getElementById('analysis-loading');
        const detectedItems = document.getElementById('detected-items');
        
        analysisSection.style.display = 'block';
        loading.style.display = 'block';
        detectedItems.innerHTML = '';
        
        // 模擬的な解析処理（実際のOCRに置き換え可能）
        await this.delay(2000);
        
        const mockItems = [
            { name: 'トマト', confidence: 0.95, category: 'vegetables' },
            { name: 'キャベツ', confidence: 0.88, category: 'vegetables' },
            { name: '牛乳', confidence: 0.92, category: 'dairy' },
            { name: '卵', confidence: 0.85, category: 'dairy' },
            { name: 'りんご', confidence: 0.90, category: 'fruits' }
        ];
        
        loading.style.display = 'none';
        this.renderDetectedItems(mockItems);
        document.getElementById('add-items').disabled = false;
    }

    // 検出アイテム表示
    renderDetectedItems(items) {
        const container = document.getElementById('detected-items');
        
        container.innerHTML = items.map(item => `
            <div class="detected-item">
                <input type="checkbox" id="item-${item.name}" value="${item.name}" data-category="${item.category}">
                <div class="detected-item-info">
                    <div class="detected-item-name">${item.name}</div>
                    <div class="detected-item-confidence">信頼度: ${Math.round(item.confidence * 100)}%</div>
                </div>
            </div>
        `).join('');

        // チェックボックスイベント
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.target.closest('.detected-item').classList.toggle('selected', e.target.checked);
            });
        });
    }

    // 選択アイテム追加
    addSelectedItems() {
        const checkedItems = document.querySelectorAll('#detected-items input[type="checkbox"]:checked');
        const today = new Date();
        
        checkedItems.forEach(checkbox => {
            const name = checkbox.value;
            const category = checkbox.dataset.category;
            
            // デフォルトの賞味期限を設定（カテゴリに基づく）
            const expiryDays = this.getDefaultExpiryDays(category);
            const expiryDate = new Date(today);
            expiryDate.setDate(expiryDate.getDate() + expiryDays);
            
            this.addItem({
                name: name,
                category: category,
                purchaseDate: today,
                expiryDate: expiryDate,
                quantity: 1
            });
        });
        
        if (checkedItems.length > 0) {
            this.showNotification(`${checkedItems.length}個の食材を追加しました`, 'success');
            this.switchTab('fridge');
        }
    }

    // カテゴリ別デフォルト賞味期限
    getDefaultExpiryDays(category) {
        const defaultDays = {
            vegetables: 7,
            fruits: 5,
            meat: 3,
            fish: 2,
            dairy: 7,
            grains: 365,
            seasonings: 365,
            others: 7
        };
        return defaultDays[category] || 7;
    }

    // 手動追加モーダル
    openManualAddModal() {
        const modal = document.getElementById('manual-add-modal');
        this.showModal(modal);
        
        // 今日の日付をデフォルトに設定
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchase-date').value = today;
    }

    closeManualAddModal() {
        this.closeModal();
        document.getElementById('manual-add-form').reset();
    }

    // 手動アイテム保存
    saveManualItem() {
        const form = document.getElementById('manual-add-form');
        const formData = new FormData(form);
        
        const name = formData.get('name') || document.getElementById('item-name').value;
        const category = formData.get('category') || document.getElementById('item-category').value;
        const purchaseDate = new Date(document.getElementById('purchase-date').value);
        const expiryDate = new Date(document.getElementById('expiry-date').value);
        const quantity = parseInt(document.getElementById('item-quantity').value) || 1;
        
        if (!name) {
            this.showNotification('商品名を入力してください', 'error');
            return;
        }
        
        // 賞味期限が設定されていない場合はデフォルト値を使用
        if (!document.getElementById('expiry-date').value) {
            const defaultDays = this.getDefaultExpiryDays(category);
            expiryDate.setDate(purchaseDate.getDate() + defaultDays);
        }
        
        this.addItem({
            name: name,
            category: category,
            purchaseDate: purchaseDate,
            expiryDate: expiryDate,
            quantity: quantity
        });
        
        this.closeManualAddModal();
        this.showNotification('食材を追加しました', 'success');
    }

    // アイテム追加
    addItem(itemData) {
        const item = {
            id: Date.now() + Math.random(),
            name: itemData.name,
            category: itemData.category,
            purchaseDate: itemData.purchaseDate,
            expiryDate: itemData.expiryDate,
            quantity: itemData.quantity || 1,
            addedDate: new Date()
        };
        
        this.items.push(item);
        this.addHistory('added', item.name, item.quantity);
        this.saveData();
        this.renderItems();
        this.renderHistory();
        this.updateStats();
    }

    // アイテム表示
    renderItems() {
        const container = document.getElementById('items-grid');
        const emptyState = document.getElementById('empty-state');
        
        // フィルター適用
        let filteredItems = this.applyFilters();
        
        if (filteredItems.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        container.innerHTML = filteredItems.map(item => {
            const daysLeft = this.getDaysLeft(item.expiryDate);
            const status = this.getItemStatus(daysLeft);
            const icon = this.getCategoryIcon(item.category);
            
            return `
                <div class="item-card ${status}" onclick="openItemModal('${item.id}')">
                    <div class="item-header">
                        <div class="item-icon" style="background: ${this.getCategoryColor(item.category)}">
                            <i class="fas fa-${icon}"></i>
                        </div>
                        <div class="item-status ${status}">${this.getStatusText(status)}</div>
                    </div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-category">${this.getCategoryText(item.category)}</div>
                    <div class="item-dates">
                        <div class="item-date">
                            <span class="label">購入:</span>
                            <span>${this.formatDate(item.purchaseDate)}</span>
                        </div>
                        <div class="item-date">
                            <span class="label">期限:</span>
                            <span>${this.formatDate(item.expiryDate)}</span>
                        </div>
                        <div class="item-date">
                            <span class="label">残り:</span>
                            <span class="days-left ${status}">${daysLeft >= 0 ? daysLeft + '日' : '期限切れ'}</span>
                        </div>
                    </div>
                    <div class="item-footer">
                        <div class="item-quantity">
                            <i class="fas fa-box"></i>
                            <span>${item.quantity}個</span>
                        </div>
                        <div class="item-actions">
                            <button class="action-btn use" onclick="event.stopPropagation(); useItemQuick('${item.id}')" title="使用">
                                <i class="fas fa-utensils"></i>
                            </button>
                            <button class="action-btn discard" onclick="event.stopPropagation(); discardItemQuick('${item.id}')" title="廃棄">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // フィルター適用
    applyFilters() {
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        
        return this.items.filter(item => {
            // カテゴリフィルター
            if (categoryFilter && item.category !== categoryFilter) {
                return false;
            }
            
            // ステータスフィルター
            if (statusFilter) {
                const daysLeft = this.getDaysLeft(item.expiryDate);
                const status = this.getItemStatus(daysLeft);
                if (status !== statusFilter) {
                    return false;
                }
            }
            
            return true;
        });
    }

    // ソート
    sortItems() {
        this.items.sort((a, b) => {
            return a.expiryDate - b.expiryDate;
        });
        this.saveData();
        this.renderItems();
        this.showNotification('期限順にソートしました', 'info');
    }

    // 残り日数計算
    getDaysLeft(expiryDate) {
        const today = new Date();
        const timeDiff = expiryDate - today;
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    // アイテムステータス
    getItemStatus(daysLeft) {
        if (daysLeft < 0) return 'expired';
        if (daysLeft <= 3) return 'expiring';
        return 'fresh';
    }

    // ステータステキスト
    getStatusText(status) {
        const statusTexts = {
            fresh: '新鮮',
            expiring: '期限近い',
            expired: '期限切れ'
        };
        return statusTexts[status] || '';
    }

    // カテゴリアイコン
    getCategoryIcon(category) {
        const icons = {
            vegetables: 'carrot',
            fruits: 'apple-alt',
            meat: 'drumstick-bite',
            fish: 'fish',
            dairy: 'cheese',
            grains: 'bread-slice',
            seasonings: 'pepper-hot',
            others: 'box'
        };
        return icons[category] || 'box';
    }

    // カテゴリ色
    getCategoryColor(category) {
        const colors = {
            vegetables: '#4CAF50',
            fruits: '#FF9800',
            meat: '#F44336',
            fish: '#2196F3',
            dairy: '#9C27B0',
            grains: '#795548',
            seasonings: '#FF5722',
            others: '#607D8B'
        };
        return colors[category] || '#607D8B';
    }

    // カテゴリテキスト
    getCategoryText(category) {
        const texts = {
            vegetables: '野菜',
            fruits: '果物',
            meat: '肉類',
            fish: '魚類',
            dairy: '乳製品',
            grains: '穀物',
            seasonings: '調味料',
            others: 'その他'
        };
        return texts[category] || 'その他';
    }

    // 統計更新
    updateStats() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const expiringItems = this.items.filter(item => {
            const daysLeft = this.getDaysLeft(item.expiryDate);
            return daysLeft <= 3 && daysLeft >= 0;
        }).reduce((sum, item) => sum + item.quantity, 0);
        
        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('expiring-items').textContent = expiringItems;
    }

    // アイテム詳細モーダル
    openItemModal(itemId) {
        const item = this.items.find(i => i.id == itemId);
        if (!item) return;
        
        this.currentItemId = itemId;
        
        // モーダル内容更新
        document.getElementById('modal-item-name').textContent = item.name;
        document.getElementById('modal-category').textContent = this.getCategoryText(item.category);
        document.getElementById('modal-purchase-date').textContent = this.formatDate(item.purchaseDate);
        document.getElementById('modal-expiry-date').textContent = this.formatDate(item.expiryDate);
        document.getElementById('modal-quantity').textContent = item.quantity;
        
        const daysLeft = this.getDaysLeft(item.expiryDate);
        const daysLeftElement = document.getElementById('modal-days-left');
        daysLeftElement.textContent = daysLeft >= 0 ? daysLeft + '日' : '期限切れ';
        daysLeftElement.className = 'days-left ' + this.getItemStatus(daysLeft);
        
        // アイコン更新
        const icon = this.getCategoryIcon(item.category);
        const modalIcon = document.getElementById('modal-icon');
        modalIcon.className = `fas fa-${icon}`;
        modalIcon.parentElement.style.background = this.getCategoryColor(item.category);
        
        this.showModal(document.getElementById('item-modal'));
    }

    // モーダル表示
    showModal(modal) {
        this.currentModal = modal;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // モーダル閉じる
    closeModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('show');
            this.currentModal = null;
            document.body.style.overflow = '';
        }
    }

    // 数量変更
    changeQuantity(delta) {
        if (!this.currentItemId) return;
        
        const item = this.items.find(i => i.id == this.currentItemId);
        if (!item) return;
        
        const newQuantity = Math.max(1, item.quantity + delta);
        item.quantity = newQuantity;
        
        document.getElementById('modal-quantity').textContent = newQuantity;
        this.saveData();
        this.renderItems();
        this.updateStats();
    }

    // アイテム使用
    useItem() {
        if (!this.currentItemId) return;
        
        const item = this.items.find(i => i.id == this.currentItemId);
        if (!item) return;
        
        if (item.quantity > 1) {
            item.quantity--;
            this.addHistory('used', item.name, 1);
            document.getElementById('modal-quantity').textContent = item.quantity;
        } else {
            this.removeItem(this.currentItemId);
            this.addHistory('used', item.name, 1);
            this.closeModal();
        }
        
        this.saveData();
        this.renderItems();
        this.renderHistory();
        this.updateStats();
        this.showNotification(`${item.name}を使用しました`, 'success');
    }

    // アイテム廃棄
    discardItem() {
        if (!this.currentItemId) return;
        
        const item = this.items.find(i => i.id == this.currentItemId);
        if (!item) return;
        
        this.removeItem(this.currentItemId);
        this.addHistory('discarded', item.name, item.quantity);
        this.closeModal();
        
        this.saveData();
        this.renderItems();
        this.renderHistory();
        this.updateStats();
        this.showNotification(`${item.name}を廃棄しました`, 'warning');
    }

    // クイック使用
    useItemQuick(itemId) {
        const item = this.items.find(i => i.id == itemId);
        if (!item) return;
        
        if (item.quantity > 1) {
            item.quantity--;
            this.addHistory('used', item.name, 1);
        } else {
            this.removeItem(itemId);
            this.addHistory('used', item.name, 1);
        }
        
        this.saveData();
        this.renderItems();
        this.renderHistory();
        this.updateStats();
        this.showNotification(`${item.name}を使用しました`, 'success');
    }

    // クイック廃棄
    discardItemQuick(itemId) {
        const item = this.items.find(i => i.id == itemId);
        if (!item) return;
        
        this.removeItem(itemId);
        this.addHistory('discarded', item.name, item.quantity);
        
        this.saveData();
        this.renderItems();
        this.renderHistory();
        this.updateStats();
        this.showNotification(`${item.name}を廃棄しました`, 'warning');
    }

    // アイテム削除
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id != itemId);
    }

    // 履歴追加
    addHistory(action, itemName, quantity) {
        this.history.unshift({
            id: Date.now() + Math.random(),
            action: action,
            itemName: itemName,
            quantity: quantity,
            date: new Date()
        });
        
        // 履歴を最新100件に制限
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
    }

    // 履歴表示
    renderHistory() {
        const container = document.getElementById('history-list');
        const emptyHistory = document.getElementById('empty-history');
        
        // フィルター適用
        let filteredHistory = this.applyHistoryFilters();
        
        if (filteredHistory.length === 0) {
            container.innerHTML = '';
            emptyHistory.style.display = 'block';
            return;
        }
        
        emptyHistory.style.display = 'none';
        
        container.innerHTML = filteredHistory.map(entry => {
            const actionText = this.getActionText(entry.action);
            const actionIcon = this.getActionIcon(entry.action);
            
            return `
                <div class="history-item">
                    <div class="history-icon ${entry.action}">
                        <i class="fas fa-${actionIcon}"></i>
                    </div>
                    <div class="history-info">
                        <div class="history-item-name">${entry.itemName}</div>
                        <div class="history-action">${actionText} - ${entry.quantity}個</div>
                        <div class="history-date">${this.formatDateTime(entry.date)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 履歴フィルター適用
    applyHistoryFilters() {
        const actionFilter = document.getElementById('history-filter')?.value || '';
        const dateFilter = parseInt(document.getElementById('date-filter')?.value) || 7;
        
        const cutoffDate = new Date();
        if (dateFilter !== 'all') {
            cutoffDate.setDate(cutoffDate.getDate() - dateFilter);
        }
        
        return this.history.filter(entry => {
            // アクションフィルター
            if (actionFilter && entry.action !== actionFilter) {
                return false;
            }
            
            // 日付フィルター
            if (dateFilter !== 'all' && entry.date < cutoffDate) {
                return false;
            }
            
            return true;
        });
    }

    // アクションテキスト
    getActionText(action) {
        const texts = {
            added: '追加',
            used: '使用',
            discarded: '廃棄'
        };
        return texts[action] || action;
    }

    // アクションアイコン
    getActionIcon(action) {
        const icons = {
            added: 'plus',
            used: 'utensils',
            discarded: 'trash'
        };
        return icons[action] || 'question';
    }

    // 日付フォーマット
    formatDate(date) {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    }

    // 日時フォーマット
    formatDateTime(date) {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // 通知表示
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = notification.querySelector('.notification-icon');
        const messageElement = notification.querySelector('.notification-message');
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        icon.className = `notification-icon fas ${icons[type] || icons.info}`;
        messageElement.textContent = message;
        notification.className = `notification ${type}`;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 遅延処理
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// グローバル関数（HTMLから呼び出される）
let fridgeTracker;

function switchTab(tabName) {
    fridgeTracker.switchTab(tabName);
}

function openItemModal(itemId) {
    fridgeTracker.openItemModal(itemId);
}

function closeModal() {
    fridgeTracker.closeModal();
}

function closeManualAddModal() {
    fridgeTracker.closeManualAddModal();
}

function changeQuantity(delta) {
    fridgeTracker.changeQuantity(delta);
}

function useItem() {
    fridgeTracker.useItem();
}

function discardItem() {
    fridgeTracker.discardItem();
}

function useItemQuick(itemId) {
    fridgeTracker.useItemQuick(itemId);
}

function discardItemQuick(itemId) {
    fridgeTracker.discardItemQuick(itemId);
}

function editItem() {
    fridgeTracker.showNotification('編集機能は開発中です', 'info');
}

function saveManualItem() {
    fridgeTracker.saveManualItem();
}

// アプリ初期化
document.addEventListener('DOMContentLoaded', function() {
    fridgeTracker = new FridgeTracker();
});