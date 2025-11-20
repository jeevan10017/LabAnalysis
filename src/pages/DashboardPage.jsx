import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuthStore } from '../hooks/useAuthStore';
import Spinner from '../components/common/Spinner';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import Button from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import Switch from '../components/common/Switch';
import PageLoader from '../components/common/PageLoader';

const EditModal = ({ experiment, onClose, onSave }) => {
  const [title, setTitle] = useState(experiment.title);
  const [desc, setDesc] = useState(experiment.description);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ id: experiment.id, updates: { title, description: desc } });
    setIsSaving(false);
  };

  return (
     <Modal isOpen={true} onClose={onClose} title="Edit Experiment">
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium">Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full  border-secondary-DEFAULT shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="edit-desc" className="block text-sm font-medium">Description</label>
            <textarea
              id="edit-desc"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="mt-1 block w-full  border-secondary-DEFAULT shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Spinner /> : 'Save Changes'}
          </Button>
        </div>
    </Modal>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editingExperiment, setEditingExperiment] = useState(null);

  const { data: experiments, isLoading } = useQuery({
    queryKey: ['myExperiments', user?.uid],
    queryFn: async () => {
      const q = query(collection(db, 'experiments'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (experiment) => {
      await deleteDoc(doc(db, 'experiments', experiment.id));
      if (experiment.storagePath) {
        const storageRef = ref(storage, experiment.storagePath);
        await deleteObject(storageRef);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myExperiments', user?.uid] });
    },
    onError: (e) => console.error("Error deleting:", e),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const docRef = doc(db, 'experiments', id);
      await updateDoc(docRef, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myExperiments', user?.uid] });
      setEditingExperiment(null);
    },
    onError: (e) => console.error("Error updating:", e),
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      const docRef = doc(db, 'experiments', id);
      await updateDoc(docRef, { isPublic: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myExperiments', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['publicExperiments'] });
    },
    onError: (e) => console.error("Error toggling visibility:", e),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="container mx-auto max-w-5xl"> 
      <h1 className="mb-6 text-3xl font-bold">My Experiment History</h1>
      <div className="space-y-4">
        {experiments && experiments.length > 0 ? (
          experiments.map(exp => {
            // Check if THIS specific experiment is toggling
            const isToggling = toggleVisibilityMutation.isLoading && 
                               toggleVisibilityMutation.variables?.id === exp.id;

            return (
              <div key={exp.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between  bg-white p-5 shadow-sm">
                <div>
                  <h3 className="text-lg font-semibold text-primary-dark">{exp.title}</h3>
                  <p className="text-sm text-secondary-dark mt-1">
                    {new Date(exp.createdAt?.toDate()).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                  {/* Toggle Switch */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      // FIX: Force boolean with !!
                      enabled={!!exp.isPublic}
                      disabled={isToggling}
                      onChange={(newStatus) => {
                        toggleVisibilityMutation.mutate({ id: exp.id, newStatus });
                      }}
                      srLabel={`Toggle ${exp.title} visibility`}
                    />
                    <span className="text-xs font-medium text-gray-600 min-w-[40px]">
                      {exp.isPublic ? 'Public' : 'Private'}
                    </span>
                    {isToggling && <Spinner />}
                  </div>

                  <div className="h-6 w-px bg-secondary-DEFAULT"></div>

                  <Link to={`/experiment/${exp.id}`}>
                    <Button variant="ghost" aria-label="View">
                      <FaEye className="mr-2" /> View
                    </Button>
                  </Link>
                  <Button variant="ghost" aria-label="Edit" onClick={() => setEditingExperiment(exp)}>
                    <FaEdit className="text-gray-600" />
                  </Button>
                  <Button variant="ghost" aria-label="Delete" onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${exp.title}"?`)) {
                      deleteMutation.mutate(exp);
                    }
                  }}>
                    <FaTrash className="text-red-600" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-10 bg-white  shadow-sm">
            <p className="text-secondary-dark">You haven't uploaded any experiments yet.</p>
            <Link to="/upload">
              <Button className="mt-4">Upload your first experiment</Button>
            </Link>
          </div>
        )}
      </div>

      {editingExperiment && (
        <EditModal
          experiment={editingExperiment}
          onClose={() => setEditingExperiment(null)}
          onSave={editMutation.mutateAsync} 
        />
      )}
    </div>
  );
}