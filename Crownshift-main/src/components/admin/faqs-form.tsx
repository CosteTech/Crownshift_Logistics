'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit2, Plus, Eye, EyeOff } from 'lucide-react';
import { getFAQs, addFAQ, updateFAQ, deleteFAQ } from '@/app/actions';
import { isDefaultFAQ } from '@/lib/data-models';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  isDefault?: boolean;
  isVisible?: boolean;
  order?: number;
}

export default function FAQForm() {
  const { toast } = useToast();
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
  });

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const result = await getFAQs();
        if (result.success) {
          setFAQs(result.data);
        } else {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch FAQs',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [toast]);

  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({
        title: 'Error',
        description: 'Question and answer are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await addFAQ(formData);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'FAQ created successfully',
        });
        setFormData({ question: '', answer: '' });
        setIsAdding(false);

        // Refresh FAQs
        const refreshResult = await getFAQs();
        if (refreshResult.success) {
          setFAQs(refreshResult.data);
        }
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create FAQ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFAQ = async (id: string, data: Partial<FAQ>) => {
    try {
      const result = await updateFAQ(id, data);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'FAQ updated successfully',
        });
        setEditingId(null);

        // Refresh FAQs
        const refreshResult = await getFAQs();
        if (refreshResult.success) {
          setFAQs(refreshResult.data);
        }
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update FAQ',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm('Delete this FAQ?')) return;

    try {
      const result = await deleteFAQ(id);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'FAQ deleted successfully',
        });

        // Refresh FAQs
        const refreshResult = await getFAQs();
        if (refreshResult.success) {
          setFAQs(refreshResult.data);
        }
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete FAQ',
        variant: 'destructive',
      });
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    await handleUpdateFAQ(id, { isVisible: !isVisible });
  };

  if (loading && faqs.length === 0) {
    return <div className="text-center py-8">Loading FAQs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add FAQ Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFAQ} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <Input
                  placeholder="Enter FAQ question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Answer</label>
                <textarea
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  placeholder="Enter FAQ answer"
                  rows={5}
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create FAQ'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setFormData({ question: '', answer: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAdding && (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add New FAQ
        </Button>
      )}

      {/* FAQ List */}
      <div className="space-y-3">
        {faqs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No FAQs yet</p>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="pt-6">
                {editingId === faq.id ? (
                  // Edit mode
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateFAQ(faq.id, formData);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Question
                      </label>
                      <Input
                        value={formData.question || faq.question}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            question: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Answer
                      </label>
                      <textarea
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                        rows={5}
                        value={formData.answer || faq.answer}
                        onChange={(e) =>
                          setFormData({ ...formData, answer: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setFormData({ question: '', answer: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                      {isDefaultFAQ(faq.id) && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {faq.answer}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(faq.id);
                          setFormData({
                            question: faq.question,
                            answer: faq.answer,
                          });
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleVisibility(faq.id, faq.isVisible !== false)
                        }
                      >
                        {faq.isVisible !== false ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Hide
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Show
                          </>
                        )}
                      </Button>

                      {!isDefaultFAQ(faq.id) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteFAQ(faq.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
