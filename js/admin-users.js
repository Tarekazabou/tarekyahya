/**
 * Admin Users Management
 * Handle user access level management
 */

// ==================== USERS MANAGEMENT ====================

/**
 * Load users table with access level management
 */
async function loadUsersTable() {
    const container = document.getElementById('users-table-container');
    if (!container) return;

    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

    try {
        const filter = document.getElementById('users-filter')?.value || 'all';
        
        // Get users with their profiles (using regular client - RLS is now disabled for this query)
        let query = supabaseClient
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('access_level', parseInt(filter));
        }

        const { data: users, error } = await query;

        if (error) throw error;

        // Update stats
        updateUserStats(users);

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>Aucun utilisateur trouvé</p>
                </div>
            `;
            return;
        }

        // Render users table
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Niveau d'Accès</th>
                        <th>Abonnement</th>
                        <th>Date d'Inscription</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => renderUserRow(user)).join('')}
                </tbody>
            </table>
        `;

        console.log('✅ Users table loaded');
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Erreur lors du chargement des utilisateurs', 'error');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadUsersTable()">Réessayer</button>
            </div>
        `;
    }
}

/**
 * Render a single user row
 */
function renderUserRow(user) {
    const accessLevels = ['Visiteur', 'Membre', 'Premium', 'Administrateur'];
    const accessColors = ['badge-secondary', 'badge-info', 'badge-warning', 'badge-success'];
    const accessIcons = ['fa-user', 'fa-star', 'fa-crown', 'fa-shield-halved'];
    
    const accessLevel = user.access_level || 0;
    const accessName = accessLevels[accessLevel];
    const accessColor = accessColors[accessLevel];
    const accessIcon = accessIcons[accessLevel];
    
    const tierLabels = {
        'free': 'Gratuit',
        'basic': 'Basique',
        'premium': 'Premium',
        'enterprise': 'Entreprise'
    };
    
    const tierName = tierLabels[user.subscription_tier] || 'Gratuit';
    
    const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-';
    
    return `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                        ${(user.username || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <strong>${escapeHtml(user.username || 'Sans nom')}</strong>
                        ${user.full_name ? `<br><small style="color: #64748b;">${escapeHtml(user.full_name)}</small>` : ''}
                    </div>
                </div>
            </td>
            <td>${escapeHtml(user.email || '')}</td>
            <td>
                <span class="badge ${accessColor}">
                    <i class="fas ${accessIcon}"></i> ${accessName}
                </span>
            </td>
            <td><span class="badge badge-secondary">${tierName}</span></td>
            <td>${createdDate}</td>
            <td class="actions">
                <button class="btn-icon edit" onclick="openUserAccessModal('${user.id}')" title="Modifier l'accès">
                    <i class="fas fa-key"></i>
                </button>
                <button class="btn-icon view" onclick="viewUserDetails('${user.id}')" title="Voir détails">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Update user stats
 */
function updateUserStats(users) {
    const total = users.length;
    const members = users.filter(u => u.access_level === 1).length;
    const premium = users.filter(u => u.access_level === 2).length;
    const admins = users.filter(u => u.access_level === 3).length;
    
    document.getElementById('stat-total-users').textContent = total;
    document.getElementById('stat-members').textContent = members;
    document.getElementById('stat-premium').textContent = premium;
    document.getElementById('stat-admins').textContent = admins;
}

/**
 * Open user access modal
 */
async function openUserAccessModal(userId) {
    try {
        // Get user data
        const { data: user, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const accessLevels = ['Visiteur', 'Membre', 'Premium', 'Administrateur'];
        const currentLevel = user.access_level || 0;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-key"></i> Modifier l'Accès Utilisateur</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                        <strong>${escapeHtml(user.username || user.email)}</strong>
                        <br><small style="color: #64748b;">${escapeHtml(user.email)}</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-access-level">Niveau d'Accès</label>
                        <select id="user-access-level" class="form-control">
                            <option value="0" ${currentLevel === 0 ? 'selected' : ''}>
                                Visiteur (Niveau 0)
                            </option>
                            <option value="1" ${currentLevel === 1 ? 'selected' : ''}>
                                Membre (Niveau 1)
                            </option>
                            <option value="2" ${currentLevel === 2 ? 'selected' : ''}>
                                Premium (Niveau 2)
                            </option>
                            <option value="3" ${currentLevel === 3 ? 'selected' : ''}>
                                Administrateur (Niveau 3)
                            </option>
                        </select>
                        <small class="form-text">Les utilisateurs avec un niveau supérieur peuvent voir le contenu réservé à leur niveau.</small>
                    </div>

                    <div style="padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 1rem;">
                        <strong><i class="fas fa-info-circle"></i> Information</strong>
                        <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">
                            Le changement prendra effet immédiatement. L'utilisateur pourra accéder à tous les contenus de son niveau et inférieur.
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Annuler
                    </button>
                    <button class="btn btn-primary" onclick="updateUserAccess('${userId}')">
                        <i class="fas fa-save"></i> Enregistrer
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error opening user access modal:', error);
        showToast('Erreur lors du chargement des données utilisateur', 'error');
    }
}

/**
 * Update user access level
 */
async function updateUserAccess(userId) {
    const accessLevel = parseInt(document.getElementById('user-access-level').value);
    
    try {
        // Map access level to role and tier
        const roleMap = {
            0: { role: 'visitor', tier: 'free' },
            1: { role: 'member', tier: 'basic' },
            2: { role: 'premium', tier: 'premium' },
            3: { role: 'admin', tier: 'enterprise' }
        };
        
        const mapping = roleMap[accessLevel];
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({
                access_level: accessLevel,
                role: mapping.role,
                subscription_tier: mapping.tier,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        showToast('Niveau d\'accès mis à jour avec succès', 'success');
        
        // Close modal
        document.querySelector('.modal')?.remove();
        
        // Reload table
        await loadUsersTable();
        
    } catch (error) {
        console.error('Error updating user access:', error);
        showToast('Erreur lors de la mise à jour: ' + error.message, 'error');
    }
}

/**
 * View user details
 */
async function viewUserDetails(userId) {
    try {
        const { data: user, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const accessLevels = ['Visiteur', 'Membre', 'Premium', 'Administrateur'];
        const accessIcons = ['fa-user', 'fa-star', 'fa-crown', 'fa-shield-halved'];
        const accessColors = ['#6b7280', '#3b82f6', '#f59e0b', '#10b981'];
        
        const accessLevel = user.access_level || 0;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-circle"></i> Détails de l'Utilisateur</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin-bottom: 1.5rem;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.2); display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; margin-bottom: 1rem;">
                            ${(user.username || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <h3 style="margin: 0; font-size: 1.5rem;">${escapeHtml(user.username || 'Sans nom')}</h3>
                        ${user.full_name ? `<p style="margin: 0.5rem 0 0; opacity: 0.9;">${escapeHtml(user.full_name)}</p>` : ''}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem;">Email</div>
                            <strong>${escapeHtml(user.email)}</strong>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem;">Niveau d'Accès</div>
                            <strong style="color: ${accessColors[accessLevel]};">
                                <i class="fas ${accessIcons[accessLevel]}"></i> ${accessLevels[accessLevel]}
                            </strong>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem;">Rôle</div>
                            <strong>${user.role || '-'}</strong>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem;">Abonnement</div>
                            <strong>${user.subscription_tier || 'free'}</strong>
                        </div>
                    </div>

                    <div style="padding: 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem;">Date d'Inscription</div>
                        <strong>${new Date(user.created_at).toLocaleString('fr-FR')}</strong>
                    </div>

                    ${user.subscription_end ? `
                        <div style="padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <div style="font-size: 0.8rem; color: #92400e; margin-bottom: 0.25rem;">Abonnement Expire Le</div>
                            <strong>${new Date(user.subscription_end).toLocaleString('fr-FR')}</strong>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Fermer
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); openUserAccessModal('${userId}')">
                        <i class="fas fa-key"></i> Modifier l'Accès
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing user details:', error);
        showToast('Erreur lors du chargement des détails', 'error');
    }
}
