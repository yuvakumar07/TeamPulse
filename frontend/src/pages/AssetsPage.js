import React, { useState } from 'react';
import AssetListPrime from '../components/assets/AssetListPrime';
import AssetFormPrime from '../components/assets/AssetFormPrime';

const AssetsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedAsset(null);
    setShowForm(true);
  };

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedAsset(null);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="assets-page">
      <AssetListPrime
        key={refreshTrigger}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      <AssetFormPrime
        asset={selectedAsset}
        visible={showForm}
        onHide={handleCloseForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default AssetsPage;
