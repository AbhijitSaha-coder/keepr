import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Clock,
  DollarSign,
  MapPin,
  Tag,
  Trash2,
  Edit,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { InventoryItem, InventoryCategory, MaintenanceRecord } from '../types';

export const InventoryPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Maintenance modal
  const [maintenanceItem, setMaintenanceItem] = useState<InventoryItem | null>(null);
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDate, setMaintDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [maintCost, setMaintCost] = useState<number>(0);
  const [maintPerformer, setMaintPerformer] = useState('');

  // Item form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('OTHER');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [warrantyExpiration, setWarrantyExpiration] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Queries
  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', currentWorkspace?.id, categoryFilter, searchTerm],
    queryFn: () =>
      api.get<InventoryItem[]>('/inventory', {
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchTerm || undefined
      }),
    enabled: !!currentWorkspace?.id
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddModalOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingItem(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const addMaintenanceMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      api.post(`/inventory/${itemId}/maintenance`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setMaintenanceItem(null);
      resetMaintForm();
    }
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: (maintenanceId: string) =>
      api.patch(`/inventory/maintenance/${maintenanceId}`, {
        status: 'COMPLETED',
        completedDate: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('OTHER');
    setPurchaseDate('');
    setPurchasePrice(0);
    setWarrantyExpiration('');
    setSerialNumber('');
    setLocation('');
    setNotes('');
  };

  const resetMaintForm = () => {
    setMaintTitle('');
    setMaintDate(new Date().toISOString().split('T')[0]);
    setMaintCost(0);
    setMaintPerformer('');
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setCategory(item.category);
    setPurchaseDate(item.purchaseDate ? item.purchaseDate.split('T')[0] : '');
    setPurchasePrice(item.purchasePrice || 0);
    setWarrantyExpiration(item.warrantyExpiration ? item.warrantyExpiration.split('T')[0] : '');
    setSerialNumber(item.serialNumber || '');
    setLocation(item.location || '');
    setNotes(item.notes || '');
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      description: description || undefined,
      category,
      purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      warrantyExpiration: warrantyExpiration ? new Date(warrantyExpiration).toISOString() : undefined,
      serialNumber: serialNumber || undefined,
      location: location || undefined,
      notes: notes || undefined
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceItem) return;
    addMaintenanceMutation.mutate({
      itemId: maintenanceItem.id,
      data: {
        title: maintTitle,
        scheduledDate: new Date(maintDate).toISOString(),
        cost: maintCost ? Number(maintCost) : undefined,
        performer: maintPerformer || undefined
      }
    });
  };

  const isWarrantyExpiringSoon = (expirationDate?: string | null) => {
    if (!expirationDate) return false;
    const diffDays = (new Date(expirationDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 30;
  };

  const isWarrantyExpired = (expirationDate?: string | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate).getTime() < Date.now();
  };

  const categories: { label: string; value: InventoryCategory }[] = [
    { label: 'Electronics & Audio', value: 'ELECTRONICS' },
    { label: 'Kitchen & Home Appliances', value: 'APPLIANCES' },
    { label: 'Furniture & Decor', value: 'FURNITURE' },
    { label: 'Vehicles & Garage', value: 'VEHICLES' },
    { label: 'Tools & Equipment', value: 'EQUIPMENT' },
    { label: 'Other Possessions', value: 'OTHER' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Household Inventory & Assets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track appliances, serial numbers, locations, warranties, and maintenance schedules.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          Add Item
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, serial, or room location..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Inventory Grid */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="w-7 h-7" />}
          title="No inventory recorded"
          description="Log appliances, electronics, and valuable items to track warranties and maintenance."
          actionLabel="Add Item"
          onAction={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const expiringSoon = isWarrantyExpiringSoon(item.warrantyExpiration);
            const expired = isWarrantyExpired(item.warrantyExpiration);
            const nextMaint = item.maintenanceRecords?.[0];

            return (
              <Card key={item.id} className="flex flex-col justify-between hoverable">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                      {item.location && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant="slate" size="sm">{item.category}</Badge>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 my-3">
                    {item.purchasePrice !== undefined && item.purchasePrice !== null && (
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Purchase: ${item.purchasePrice.toFixed(2)}
                      </div>
                    )}
                    {item.serialNumber && (
                      <div className="font-mono text-[11px] text-slate-500">
                        SN: {item.serialNumber}
                      </div>
                    )}

                    {/* Warranty Status */}
                    {item.warrantyExpiration && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {expiringSoon ? (
                          <Badge variant="amber" size="sm">
                            <ShieldAlert className="w-3 h-3 mr-1 inline" />
                            Warranty Expiring Soon ({new Date(item.warrantyExpiration).toLocaleDateString()})
                          </Badge>
                        ) : expired ? (
                          <Badge variant="slate" size="sm">Warranty Expired</Badge>
                        ) : (
                          <Badge variant="green" size="sm">
                            <ShieldCheck className="w-3 h-3 mr-1 inline" />
                            Warranty Active ({new Date(item.warrantyExpiration).toLocaleDateString()})
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Scheduled Maintenance */}
                    {nextMaint && (
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 mt-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5" /> {nextMaint.title}
                          </span>
                          <button
                            onClick={() => completeMaintenanceMutation.mutate(nextMaint.id)}
                            title="Mark Completed"
                            className="text-emerald-700 hover:text-emerald-800 font-bold"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[10px] text-amber-700/80 mt-0.5">
                          Scheduled: {new Date(nextMaint.scheduledDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMaintenanceItem(item)}
                      title="Schedule maintenance"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit item"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${item.name}"?`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      title="Delete item"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setMaintenanceItem(item)}>
                    + Maintenance
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingItem}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        description="Track electronics, major appliances, furniture, and vehicles."
      >
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <Input
            label="Item Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bosch Dishwasher, Samsung TV, Lawn Mower"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Location / Room"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kitchen, Living Room, Garage"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Purchase Price ($)"
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
            />
            <Input
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Warranty Expiration Date"
              type="date"
              value={warrantyExpiration}
              onChange={(e) => setWarrantyExpiration(e.target.value)}
            />
            <Input
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="SN / Model code"
            />
          </div>

          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Warranty registered, user manual location, etc."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={!!maintenanceItem}
        onClose={() => setMaintenanceItem(null)}
        title={`Schedule Maintenance: ${maintenanceItem?.name || ''}`}
        description="Set recurring maintenance or scheduled service dates."
      >
        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
          <Input
            label="Service Title"
            required
            value={maintTitle}
            onChange={(e) => setMaintTitle(e.target.value)}
            placeholder="Filter replacement, oil change, descaling"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Scheduled Date"
              type="date"
              required
              value={maintDate}
              onChange={(e) => setMaintDate(e.target.value)}
            />
            <Input
              label="Estimated Cost ($)"
              type="number"
              step="0.01"
              value={maintCost}
              onChange={(e) => setMaintCost(parseFloat(e.target.value))}
            />
          </div>

          <Input
            label="Performer / Service Vendor"
            value={maintPerformer}
            onChange={(e) => setMaintPerformer(e.target.value)}
            placeholder="Self, Brand Authorized Tech, Local Contractor"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setMaintenanceItem(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={addMaintenanceMutation.isPending}>
              Schedule Service
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
