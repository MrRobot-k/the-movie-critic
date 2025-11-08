import React from 'react';
import { X } from 'lucide-react';

const FollowListModal = ({ title, users, onClose, onFollow, onUnfollow, currentUserId }) => {
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {users.map(user => (
              <div key={user.id} className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <img
                    src={user.profilePicture || '/placeholder-profile.svg'}
                    alt={user.username}
                    className="rounded-circle me-3"
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                  />
                  <div>
                    <h6 className="mb-0">{user.username}</h6>
                    <small className="text-muted">{user.slogan}</small>
                  </div>
                </div>
                {user.id !== currentUserId && (
                  <button
                    className={`btn btn-sm ${user.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => user.isFollowing ? onUnfollow(user.id) : onFollow(user.id)}
                  >
                    {user.isFollowing ? 'Dejar de seguir' : 'Seguir'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
