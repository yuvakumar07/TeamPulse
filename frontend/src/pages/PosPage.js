import React, { useState } from 'react';
import PoListPrime from '../components/pos/PoListPrime';
import PoFormPrime from '../components/pos/PoFormPrime';

const PosPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedPo(null);
    setShowForm(true);
  };

  const handleEdit = (po) => {
    setSelectedPo(po);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPo(null);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="pos-page">
      <PoListPrime
        key={refreshTrigger}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      <PoFormPrime
        po={selectedPo}
        visible={showForm}
        onHide={handleCloseForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default PosPage;
