import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Category, Bid, CategoryPrivilege } from '../types';
import './BiddingPage.css';

const BiddingPage: React.FC = () => {
  const { state } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [privileges, setPrivileges] = useState<Record<number, CategoryPrivilege>>({});
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, bidsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/bids/user')
        ]);
        
        setCategories(categoriesRes.data);
        setUserBids(bidsRes.data);

        // Fetch current privileges for each category
        const privilegePromises = categoriesRes.data.map(async (category: Category) => {
          try {
            const privilegeRes = await api.get(`/categories/${category.id}/privilege`);
            return { categoryId: category.id, privilege: privilegeRes.data };
          } catch (error) {
            return { categoryId: category.id, privilege: null };
          }
        });

        const privilegeResults = await Promise.all(privilegePromises);
        const privilegeMap = privilegeResults.reduce((acc, result) => {
          if (result.privilege) {
            acc[result.categoryId] = result.privilege;
          }
          return acc;
        }, {} as Record<number, CategoryPrivilege>);

        setPrivileges(privilegeMap);
      } catch (error) {
        console.error('Error fetching bidding data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBidSubmit = async (categoryId: number) => {
    const amount = parseFloat(bidAmounts[categoryId] || '0');
    
    if (amount <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    try {
      await api.post('/bids', {
        category_id: categoryId,
        amount
      });

      alert('Bid placed successfully!');
      
      // Refresh user bids
      const bidsRes = await api.get('/bids/user');
      setUserBids(bidsRes.data);
      
      // Clear the input
      setBidAmounts(prev => ({ ...prev, [categoryId]: '' }));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to place bid');
    }
  };

  const getUserBidForCategory = (categoryId: number) => {
    return userBids.find(bid => bid.category_id === categoryId && bid.status === 'pending');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="bidding-page">
      <div className="container">
        <div className="page-header">
          <h1>Category Bidding</h1>
          <p>Bid for exclusive selling rights in different categories</p>
        </div>

        <div className="bidding-info">
          <h2>How Bidding Works</h2>
          <div className="info-points">
            <div className="info-point">
              <span className="point-number">1</span>
              <div>
                <h4>Place Your Bid</h4>
                <p>Enter your bid amount for categories you want to sell in</p>
              </div>
            </div>
            <div className="info-point">
              <span className="point-number">2</span>
              <div>
                <h4>Highest Bidder Wins</h4>
                <p>The seller with the highest bid gets exclusive selling rights</p>
              </div>
            </div>
            <div className="info-point">
              <span className="point-number">3</span>
              <div>
                <h4>4-Month Privilege</h4>
                <p>Winners get exclusive selling rights for 4 months</p>
              </div>
            </div>
            <div className="info-point">
              <span className="point-number">4</span>
              <div>
                <h4>Automatic Rotation</h4>
                <p>Privileges rotate to the next highest bidder automatically</p>
              </div>
            </div>
          </div>
        </div>

        <div className="categories-grid">
          {categories.map((category) => {
            const userBid = getUserBidForCategory(category.id);
            const currentPrivilege = privileges[category.id];
            const isCurrentWinner = currentPrivilege && currentPrivilege.user_id === state.user?.id;

            return (
              <div key={category.id} className="category-bid-card">
                <div className="category-header">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>

                {currentPrivilege && (
                  <div className={`current-holder ${isCurrentWinner ? 'current-winner' : ''}`}>
                    <h4>Current Seller</h4>
                    <p>
                      <strong>{currentPrivilege.username}</strong>
                      {isCurrentWinner && ' (You!)'}
                    </p>
                    <p>Bid Amount: ${currentPrivilege.bid_amount}</p>
                    <p>Valid until: {formatDate(currentPrivilege.end_date)}</p>
                  </div>
                )}

                <div className="bidding-section">
                  {userBid ? (
                    <div className="existing-bid">
                      <h4>Your Current Bid</h4>
                      <p className="bid-amount">${userBid.amount}</p>
                      <p className="bid-status">Status: {userBid.status}</p>
                      
                      <div className="update-bid">
                        <input
                          type="number"
                          placeholder="Update bid amount"
                          value={bidAmounts[category.id] || ''}
                          onChange={(e) => setBidAmounts(prev => ({
                            ...prev,
                            [category.id]: e.target.value
                          }))}
                          min="0"
                          step="0.01"
                        />
                        <button 
                          onClick={() => handleBidSubmit(category.id)}
                          className="bid-button"
                        >
                          Update Bid
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="new-bid">
                      <h4>Place Your Bid</h4>
                      <input
                        type="number"
                        placeholder="Enter bid amount"
                        value={bidAmounts[category.id] || ''}
                        onChange={(e) => setBidAmounts(prev => ({
                          ...prev,
                          [category.id]: e.target.value
                        }))}
                        min="0"
                        step="0.01"
                      />
                      <button 
                        onClick={() => handleBidSubmit(category.id)}
                        className="bid-button"
                      >
                        Place Bid
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BiddingPage;