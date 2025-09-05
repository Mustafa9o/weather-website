// API Key Management
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const createKeyBtn = document.getElementById('create-key-btn');
    const apiKeyModal = document.getElementById('api-key-modal');
    const closeModal = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const modalTitle = document.getElementById('modal-title');
    const keyNameInput = document.getElementById('key-name');
    const generatedKeyGroup = document.getElementById('generated-key-group');
    const generatedKeyInput = document.getElementById('generated-key');
    const copyKeyBtn = document.getElementById('copy-key-btn');
    const apiKeysTbody = document.getElementById('api-keys-tbody');
    
    // API Keys Data
    let apiKeys = [
        { key: '451480c7101073812eeabfc84ea9d6a3', name: 'Default', status: 'active' },
        { key: '8f47401967df569bafe7e68c7f5ba155', name: 'weather', status: 'active' }
    ];
    
    let currentEditingKey = null;
    
    // Event Listeners
    createKeyBtn.addEventListener('click', openCreateModal);
    closeModal.addEventListener('click', closeApiModal);
    cancelBtn.addEventListener('click', closeApiModal);
    saveKeyBtn.addEventListener('click', saveApiKey);
    copyKeyBtn.addEventListener('click', copyGeneratedKey);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === apiKeyModal) {
            closeApiModal();
        }
    });
    
    // Functions
    function openCreateModal() {
        modalTitle.textContent = 'Create New API Key';
        keyNameInput.value = '';
        generatedKeyGroup.style.display = 'none';
        saveKeyBtn.textContent = 'Create Key';
        currentEditingKey = null;
        apiKeyModal.style.display = 'block';
        keyNameInput.focus();
    }
    
    function openEditModal(keyData) {
        modalTitle.textContent = 'Edit API Key';
        keyNameInput.value = keyData.name;
        generatedKeyGroup.style.display = 'none';
        saveKeyBtn.textContent = 'Save Changes';
        currentEditingKey = keyData;
        apiKeyModal.style.display = 'block';
        keyNameInput.focus();
    }
    
    function closeApiModal() {
        apiKeyModal.style.display = 'none';
        keyNameInput.value = '';
        generatedKeyGroup.style.display = 'none';
        currentEditingKey = null;
    }
    
    function generateApiKey() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
    
    function saveApiKey() {
        const name = keyNameInput.value.trim();
        
        if (!name) {
            alert('Please enter a key name');
            return;
        }
        
        if (currentEditingKey) {
            // Edit existing key
            currentEditingKey.name = name;
            renderApiKeys();
            closeApiModal();
            showNotification('API key updated successfully', 'success');
        } else {
            // Create new key
            const newKey = generateApiKey();
            generatedKeyInput.value = newKey;
            generatedKeyGroup.style.display = 'block';
            saveKeyBtn.style.display = 'none';
            
            // Add the new key to the list
            apiKeys.push({
                key: newKey,
                name: name,
                status: 'active'
            });
            
            renderApiKeys();
            showNotification('API key created successfully', 'success');
        }
    }
    
    function copyGeneratedKey() {
        generatedKeyInput.select();
        document.execCommand('copy');
        copyKeyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyKeyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
        showNotification('API key copied to clipboard', 'success');
    }
    
    function toggleKeyStatus(keyData) {
        keyData.status = keyData.status === 'active' ? 'inactive' : 'active';
        renderApiKeys();
        showNotification(
            `API key ${keyData.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            'success'
        );
    }
    
    function renderApiKeys() {
        apiKeysTbody.innerHTML = '';
        
        apiKeys.forEach(keyData => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="key-value">${keyData.key}</td>
                <td>${keyData.name}</td>
                <td><span class="status ${keyData.status}">${keyData.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                <td class="actions">
                    <button class="action-btn edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn ${keyData.status === 'active' ? 'deactivate-btn' : 'activate-btn'}" 
                            title="${keyData.status === 'active' ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${keyData.status === 'active' ? 'ban' : 'check-circle'}"></i>
                    </button>
                </td>
            `;
            
            // Add event listeners
            const editBtn = row.querySelector('.edit-btn');
            const toggleBtn = row.querySelector('.deactivate-btn, .activate-btn');
            
            editBtn.addEventListener('click', () => openEditModal(keyData));
            toggleBtn.addEventListener('click', () => toggleKeyStatus(keyData));
            
            apiKeysTbody.appendChild(row);
        });
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '8px';
        notification.style.color = 'white';
        notification.style.zIndex = '1001';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.animation = 'slideIn 0.3s ease';
        
        if (type === 'success') {
            notification.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#dc3545';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Initial render
    renderApiKeys();
});
