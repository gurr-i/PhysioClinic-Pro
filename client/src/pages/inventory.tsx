import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Package, AlertTriangle, TrendingDown, Search, Filter, Eye, Edit2, Trash2, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import InventoryForm from "@/components/inventory/inventory-form";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Inventory } from "@shared/schema";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reduceItem, setReduceItem] = useState<Inventory | null>(null);
  const [reduceQuantity, setReduceQuantity] = useState<number>(1);
  const { toast } = useToast();

  const { data: inventory, isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: lowStock } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    },
  });

  const reduceStockMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => 
      apiRequest("POST", `/api/inventory/${id}/reduce`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setReduceItem(null);
      setReduceQuantity(1);
      toast({
        title: "Success",
        description: "Stock reduced successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reduce stock",
        variant: "destructive",
      });
    },
  });

  const filteredInventory = (inventory || []).filter((item: Inventory) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: Inventory) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleReduceStock = (item: Inventory) => {
    setReduceItem(item);
    setReduceQuantity(1);
  };

  const handleReduceSubmit = () => {
    if (reduceItem && reduceQuantity > 0 && reduceQuantity <= reduceItem.currentStock) {
      reduceStockMutation.mutate({ id: reduceItem.id, quantity: reduceQuantity });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
  };

  const getStockStatus = (item: Inventory) => {
    if (item.currentStock === 0) {
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    } else if (item.currentStock <= item.minStockLevel) {
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { status: "In Stock", color: "bg-green-100 text-green-800" };
    }
  };

  const totalItems = (inventory || []).length;
  const lowStockCount = (lowStock || []).length;
  const outOfStockCount = (inventory || []).filter((item: Inventory) => item.currentStock === 0).length;
  const totalValue = (inventory || []).reduce((sum: number, item: Inventory) =>
    sum + (item.currentStock * parseFloat(item.unitPrice?.toString() || "0")), 0);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Manage clinic equipment and supplies</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[var(--accent-purple)] to-purple-600 hover:shadow-lg transition-all"
              onClick={() => setSelectedItem(null)}
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? "Edit Inventory Item" : "Add New Item"}
              </DialogTitle>
            </DialogHeader>
            <InventoryForm 
              item={selectedItem} 
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </header>

      <div className="p-6">
        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">{totalItems}</p>
                  <p className="text-sm text-[var(--health-green)]">Active inventory</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--medical-blue)] to-blue-600 flex items-center justify-center">
                  <Package className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">{lowStockCount}</p>
                  <p className="text-sm text-[var(--warning-amber)]">Need attention</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--warning-amber)] to-orange-500 flex items-center justify-center">
                  <AlertTriangle className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">{outOfStockCount}</p>
                  <p className="text-sm text-destructive">Urgent action needed</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-red-600 flex items-center justify-center">
                  <TrendingDown className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">
                    ₹{totalValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--health-green)]">Current stock value</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--health-green)] to-emerald-600 flex items-center justify-center">
                  <Package className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="glass-effect border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/80 backdrop-blur-sm border-border focus-visible:ring-ring"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="bg-card/70 backdrop-blur-sm">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-[var(--accent-purple)] text-white hover:bg-purple-700">
                <Filter className="mr-2 w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card className="glass-effect border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/30">
                    <TableHead className="px-6 py-4">Item</TableHead>
                    <TableHead className="px-6 py-4">Category</TableHead>
                    <TableHead className="px-6 py-4">Current Stock</TableHead>
                    <TableHead className="px-6 py-4">Min Level</TableHead>
                    <TableHead className="px-6 py-4">Unit Price</TableHead>
                    <TableHead className="px-6 py-4">Status</TableHead>
                    <TableHead className="px-6 py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-6 py-4">
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Skeleton className="w-8 h-8" />
                            <Skeleton className="w-8 h-8" />
                            <Skeleton className="w-8 h-8" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        {searchTerm || categoryFilter !== "all" ? "No items found matching your criteria" : "No inventory items found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item: Inventory) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <TableRow key={item.id} className="hover:bg-card/30 transition-colors">
                          <TableCell className="px-6 py-4">
                            <div>
                              <p className="font-medium text-[var(--dark-slate)]">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.description || `ID: ${item.id}`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className={`font-semibold ${item.currentStock <= item.minStockLevel ? 'text-destructive' : 'text-[var(--dark-slate)]'}`}>
                              {item.currentStock}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                            {item.minStockLevel}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-[var(--dark-slate)]">
                            {item.unitPrice ? `₹${parseFloat(item.unitPrice.toString()).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className={stockStatus.color}>
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 text-primary hover:bg-primary/10"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReduceStock(item)}
                                className="p-2 text-orange-600 hover:bg-orange-100"
                                disabled={item.currentStock === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="p-2 text-[var(--accent-purple)] hover:bg-purple-100"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Reduce Stock Dialog */}
        <Dialog open={!!reduceItem} onOpenChange={() => setReduceItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reduce Stock - {reduceItem?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Current Stock: <span className="font-semibold">{reduceItem?.currentStock}</span>
                </p>
                <label className="text-sm font-medium">Quantity to Reduce</label>
                <Input
                  type="number"
                  min="1"
                  max={reduceItem?.currentStock || 0}
                  value={reduceQuantity}
                  onChange={(e) => setReduceQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setReduceItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReduceSubmit}
                  disabled={reduceStockMutation.isPending || reduceQuantity <= 0 || reduceQuantity > (reduceItem?.currentStock || 0)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {reduceStockMutation.isPending ? "Reducing..." : "Reduce Stock"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
