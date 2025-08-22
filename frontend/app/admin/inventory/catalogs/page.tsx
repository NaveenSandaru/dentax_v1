"use client";
import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Menu,
  X,
  Loader,
  Package,
  CreditCard,
  Truck,
  Settings,
} from "lucide-react";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types based on your schema
interface PaymentTerm {
  payment_term_id: number;
  payment_term: string;
  purchase_orders?: any[];
}

interface ShippingMethod {
  shipping_method_id: number;
  shipping_method: string;
  purchase_orders?: any[];
}

interface EquipmentCategory {
  equipment_category_id: number;
  equipment_category: string;
  equipments?: any[];
}

type CatalogType =
  | "payment-terms"
  | "shipping-methods"
  | "equipment-categories";
type CatalogItem = PaymentTerm | ShippingMethod | EquipmentCategory;

const CatalogsManagement: React.FC = () => {
  //Overlay states
  const [activeTab, setActiveTab] = useState<CatalogType>("payment-terms");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Data states
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [equipmentCategories, setEquipmentCategories] = useState<
    EquipmentCategory[]
  >([]);

  // Form states
  const [editData, setEditData] = useState<CatalogItem | null>(null);
  const [deleteData, setDeleteData] = useState<CatalogItem | null>(null);
  const [viewData, setViewData] = useState<CatalogItem | null>(null);
  const [newItemName, setNewItemName] = useState("");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingPaymentTerms, setLoadingPaymentTerms] = useState(true);
  const [loadingShippingMethods, setLoadingShippingMethods] = useState(true);
  const [loadingEquipmentCategories, setLoadingEquipmentCategories] =
    useState(true);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isLoadingAuth, isLoggedIn, apiClient, user } =
    useContext(AuthContext);
  const router = useRouter();

  // Tab configuration
  const tabs = [
  {
    id: "payment-terms" as CatalogType,
    label: "Payment Terms",
    shortLabel: "Payment",
    icon: CreditCard,
    data: paymentTerms,
    loading: loadingPaymentTerms,
  },
  {
    id: "shipping-methods" as CatalogType,
    label: "Shipping Methods",
    shortLabel: "Shipping",
    icon: Truck,
    data: shippingMethods,
    loading: loadingShippingMethods,
  },
  {
    id: "equipment-categories" as CatalogType,
    label: "Equipment Categories",
    shortLabel: "Equip",
    icon: Package,
    data: equipmentCategories,
    loading: loadingEquipmentCategories,
  },
];



  //plural to singular
  const nameHandlerP2S = (label: string) => {
    if (label === "Equipment Categories") return "Equipment Category";
    if (label === "Payment Terms") return "Payment Term";
    if (label === "Shipping Methods") return "Shipping Method";
    return label.endsWith("s") ? label.slice(0, -1) : label;
  };
  // Get current tab configuration
  const getCurrentTabConfig = () => {
    return tabs.find((tab) => tab.id === activeTab)!;
  };

  // Get API endpoints based on active tab
  const getApiConfig = (tabType: CatalogType) => {
    const configs = {
      "payment-terms": {
        endpoint: "/inventory/payment-terms",
        nameField: "payment_term",
        idField: "payment_term_id",
        relatedField: "purchase_orders",
      },
      "shipping-methods": {
        endpoint: "/inventory/shipping-methods",
        nameField: "shipping_method",
        idField: "shipping_method_id",
        relatedField: "purchase_orders",
      },
      "equipment-categories": {
        endpoint: "/inventory/equipment-categories",
        nameField: "equipment_category",
        idField: "equipment_category_id",
        relatedField: "equipments",
      },
    };
    return configs[tabType];
  };

  // Fetch data functions
  const fetchPaymentTerms = async () => {
    setLoadingPaymentTerms(true);
    try {
      const response = await apiClient.get("/inventory/payment-terms");
      if (response.status === 200) {
        setPaymentTerms(response.data);
      }
    } catch (error: any) {
      toast.error(`Failed to fetch payment terms: ${error.message}`);
    } finally {
      setLoadingPaymentTerms(false);
    }
  };

  const fetchShippingMethods = async () => {
    setLoadingShippingMethods(true);
    try {
      const response = await apiClient.get("/inventory/shipping-methods");
      if (response.status === 200) {
        setShippingMethods(response.data);
      }
    } catch (error: any) {
      toast.error(`Failed to fetch shipping methods: ${error.message}`);
    } finally {
      setLoadingShippingMethods(false);
    }
  };

  const fetchEquipmentCategories = async () => {
    setLoadingEquipmentCategories(true);
    try {
      const response = await apiClient.get("/inventory/equipment-categories");
      if (response.status === 200) {
        setEquipmentCategories(response.data);
      }
    } catch (error: any) {
      toast.error(`Failed to fetch equipment categories: ${error.message}`);
    } finally {
      setLoadingEquipmentCategories(false);
    }
  };

  // CRUD
  const addItem = async () => {
    if (!newItemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    setAdding(true);
    try {
      const config = getApiConfig(activeTab);
      const payload = { [config.nameField]: newItemName.trim() };

      const response = await apiClient.post(config.endpoint, payload);
      if (response.status === 201) {
        if (activeTab === "payment-terms") {
          await fetchPaymentTerms();
        } else if (activeTab === "shipping-methods") {
          await fetchShippingMethods();
        } else if (activeTab === "equipment-categories") {
          await fetchEquipmentCategories();
        }

        toast.success(
          `${nameHandlerP2S(getCurrentTabConfig().label)} added successfully`
        );
        setIsAddOpen(false);
        setNewItemName("");
      }
    } catch (error: any) {
      toast.error(
        `Failed to add ${getCurrentTabConfig()
          .label.slice(0, -1)
          .toLowerCase()}: ${error.message}`
      );
    } finally {
      setAdding(false);
    }
  };

  const updateItem = async () => {
    if (!editData || !newItemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    setUpdating(true);
    try {
      const config = getApiConfig(activeTab);
      const payload = { [config.nameField]: newItemName.trim() };
      const itemId = (editData as any)[config.idField];

      const response = await apiClient.put(
        `${config.endpoint}/${itemId}`,
        payload
      );
      if (response.status === 202) {
        if (activeTab === "payment-terms") {
          await fetchPaymentTerms();
        } else if (activeTab === "shipping-methods") {
          await fetchShippingMethods();
        } else if (activeTab === "equipment-categories") {
          await fetchEquipmentCategories();
        }

        toast.success(
          `${nameHandlerP2S(getCurrentTabConfig().label)} updated successfully`
        );
        setIsEditOpen(false);
        setEditData(null);
        setNewItemName("");
      }
    } catch (error: any) {
      toast.error(
        `Failed to update ${getCurrentTabConfig()
          .label.slice(0, -1)
          .toLowerCase()}: ${error.message}`
      );
    } finally {
      setUpdating(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteData) return;

    setDeleting(true);
    try {
      const config = getApiConfig(activeTab);
      const itemId = (deleteData as any)[config.idField];

      const response = await apiClient.delete(`${config.endpoint}/${itemId}`);
      if (response.status === 200) {
        if (activeTab === "payment-terms") {
          await fetchPaymentTerms();
        } else if (activeTab === "shipping-methods") {
          await fetchShippingMethods();
        } else if (activeTab === "equipment-categories") {
          await fetchEquipmentCategories();
        }

        toast.success(
          `${nameHandlerP2S(getCurrentTabConfig().label)} deleted successfully`
        );
        setIsDeleteOpen(false);
        setDeleteData(null);
      }
    } catch (error: any) {
      toast.error(
        `Failed to delete ${getCurrentTabConfig()
          .label.slice(0, -1)
          .toLowerCase()}: ${error.message}`
      );
    } finally {
      setDeleting(false);
    }
  };

  // Search
  const getFilteredData = () => {
    const currentData = getCurrentTabConfig().data;
    const config = getApiConfig(activeTab);

    return currentData.filter((item: any) =>
      item[config.nameField].toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAddClick = () => {
    setNewItemName("");
    setIsAddOpen(true);
  };

  const handleEditClick = (item: CatalogItem) => {
    const config = getApiConfig(activeTab);
    setEditData(item);
    setNewItemName((item as any)[config.nameField]);
    setIsEditOpen(true);
  };

  const handleViewClick = (item: CatalogItem) => {
    setViewData(item);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (item: CatalogItem) => {
    setDeleteData(item);
    setIsDeleteOpen(true);
  };

  // Effects
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (user?.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [isLoadingAuth, isLoggedIn, user, router]);

  useEffect(() => {
    if (isLoggedIn && user?.role === "admin") {
      fetchPaymentTerms();
      fetchShippingMethods();
      fetchEquipmentCategories();
    }
  }, [isLoggedIn, user]);

  if (loading || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    

      

      <div className="pb-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Catalog Management
          </h1>
          <p className="hidden sm:block text-gray-600 mt-2">
            Manage payment terms, shipping methods, and equipment categories
          </p>
        </div>

        {/* Desktop Tabs */}
        <div className="grid grid-cols-3 space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`flex-1 ${activeTab === tab.id ? "bg-white text-black hover:bg-white" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent className="h-4 w-4 mr-2" />
              
<span className="hidden sm:block">{tab.label}</span>
<span className="block sm:hidden">{tab.shortLabel}</span>

              </Button>
            );
          })}
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(getCurrentTabConfig().icon, {
                    className: "h-5 w-5",
                  })}
                  {getCurrentTabConfig().label}
                </CardTitle>
                <CardDescription>
                  Manage your {getCurrentTabConfig().label.toLowerCase()}
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={`Search ${getCurrentTabConfig().label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button onClick={handleAddClick} className="shrink-0 bg-emerald-500 text-white hover:bg-emerald-600">
                  <Plus className="h-4 w-4 mr-2"/>
                  Add {nameHandlerP2S(getCurrentTabConfig().label)}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {getCurrentTabConfig().loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin mr-2" />
                Loading {getCurrentTabConfig().label.toLowerCase()}...
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredData().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? `No ${getCurrentTabConfig().label.toLowerCase()} found matching "${searchTerm}"`
                      : `No ${getCurrentTabConfig().label.toLowerCase()} found`}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {getFilteredData().map((item: any) => {
                      const config = getApiConfig(activeTab);
                      const relatedCount =
                        item[config.relatedField]?.length || 0;

                      return (
                        <div
                          key={item[config.idField]}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {item[config.nameField]}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                ID: {item[config.idField]} •{relatedCount}{" "}
                                related {config.relatedField.replace("_", " ")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewClick(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(item)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Add {nameHandlerP2S(getCurrentTabConfig().label)}
              </DialogTitle>
              <DialogDescription>
                Create a new{" "}
                {nameHandlerP2S(getCurrentTabConfig().label).toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="pb-3">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${getCurrentTabConfig()
                    .label.slice(0, -1)
                    .toLowerCase()} name`}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addItem} disabled={adding} className="bg-emerald-500 text-white hover:bg-emerald-600">
                  {adding ? (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit {nameHandlerP2S(getCurrentTabConfig().label)}
              </DialogTitle>
              <DialogDescription>
                Update the{" "}
                {nameHandlerP2S(getCurrentTabConfig().label).toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="pb-3">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${getCurrentTabConfig()
                    .label.slice(0, -1)
                    .toLowerCase()} name`}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateItem} disabled={updating} className="bg-emerald-500 text-white hover:bg-emerald-600">
                  {updating ? (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                View {nameHandlerP2S(getCurrentTabConfig().label)}
              </DialogTitle>
            </DialogHeader>
            {viewData && (
              <div className="space-y-4">
                <div className="flex">
                  <Label>ID : </Label>
                  <p className="text-sm text-gray-600 pl-2">
                    {(viewData as any)[getApiConfig(activeTab).idField]}
                  </p>
                </div>
                <div className="flex">
                  <Label>Name : </Label>
                  <p className="text-sm text-gray-600 pl-2">
                    {(viewData as any)[getApiConfig(activeTab).nameField]}
                  </p>
                </div>
                <div className="flex">
                  <Label>Related Records : </Label>
                  <p className="text-sm text-gray-600 pl-2">
                    {(viewData as any)[getApiConfig(activeTab).relatedField]
                      ?.length || 0}{" "}
                    {getApiConfig(activeTab).relatedField.replace("_", " ")}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setIsViewOpen(false)} className="bg-emerald-500 text-white hover:bg-emerald-600">Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Delete {nameHandlerP2S(getCurrentTabConfig().label)}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this{" "}
                {nameHandlerP2S(getCurrentTabConfig().label).toLowerCase()}? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteData && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">
                    {(deleteData as any)[getApiConfig(activeTab).nameField]}
                  </p>
                  <p className="text-sm text-gray-600">
                    ID: {(deleteData as any)[getApiConfig(activeTab).idField]}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteItem}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CatalogsManagement;
