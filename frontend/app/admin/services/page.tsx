"use client"
import AddInvoiceServiceDialog from "@/components/AddInvoiceServiceDialog"
import EditInvoiceServiceDialog from "@/components/EditInvoiceServiceDialog"
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertTriangle, Edit, Eye, Stethoscope, Trash2 } from "lucide-react";
import AddTreatmentDialog from "@/components/AddTreatmentDialog";
import EditTreatmentDialog from "@/components/EditTreatmentDialog";
import DentistListDialog from "@/components/DentistListDialog";

interface Treatment {
    no: number;
    treatment_group: string;
}

interface InvoiceService {
    service_id: number;
    service_name: string;
    amount: number;
    description: string;
    ref_code: string;
    tax_type: string;
    tax_percentage: string;
    treatment: Treatment;
    treatment_type: string;
    Consumable_charge: number;
    Lab_charge: number;
    is_active: boolean;
    duration: number;
}

export default function InvoiceServicePage() {

    const router = useRouter();

    const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);

    const [invoiceServices, setInvoiceServices] = useState<InvoiceService[]>([]);
    const [treatmentGroups, setTreatmentGroups] = useState<Treatment[]>([]);
    const [serviceToEdit, setServiceToEdit] = useState<InvoiceService | null>(null);

    const [selectedServiceID, setSelectedServiceID] = useState<number>(0);

    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [showAddTreatmentDialog, setShowAddTreatmentDialog] = useState(false);
    const [showEditTreatmentDialog, setShowEditTreatmentDialog] = useState(false);

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [showDentistList, setShowDentistList] = useState(false);

    const [fetchingData, setFetchingData] = useState(false);
    const [editingInvoiceService, setEditingInvoiceService] = useState(false);
    const [deletingInvoiceService, setDeletingInvoiceService] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

    const fetchInvoiceServices = async () => {
        setFetchingData(true);
        try {
            const res = await apiClient.get('invoice-services');
            if (res.status == 500) {
                throw new Error("Error fetching invoice services");
            }
            console.log(res.data);
            setInvoiceServices(res.data);

        }
        catch (err: any) {
            toast.error(err.message);
        }
        finally {
            setFetchingData(false);
        }
    };

    const fetchTreatmentGroups = async () => {
        try {
            const res = await apiClient.get("treatments")
            setTreatmentGroups(res.data)
        } catch (err) {
            toast.error("Failed to fetch treatment groups")
        }
    };

    const handleEditInvoiceService = (service: InvoiceService) => {
        setServiceToEdit(service)
        setEditDialogOpen(true)
    };

    const handleViewDoctors = (serviceID: number) => {
        setSelectedServiceID(serviceID);
        setShowDentistList(true);
    };

    const handleDeleteClick = (service_id: number) => {
        setServiceToDelete(service_id);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteInvoiceService = async () => {
        if (!serviceToDelete) return;
        
        setDeletingInvoiceService(true);
        try {
            const res = await apiClient.delete(`invoice-services/${serviceToDelete}`);
            if (res.status == 500) {
                throw new Error("Error deleting invoice service");
            }
            toast.success("Invoice service deleted successfully");
            fetchInvoiceServices();
            setDeleteDialogOpen(false);
        }
        catch (err: any) {
            toast.error(err.message);
        }
        finally {
            setDeletingInvoiceService(false);
            setServiceToDelete(null);
        }
    };

    useEffect(() => {
        if (isLoadingAuth) return;
        if (!isLoggedIn) {
            toast.error("Please log in");
            router.push("/login");
        }
        else if (user.role != "admin" && user.role != "dentist") {
            toast.error("Access Denied");
            router.push("/");
        }
    }, [isLoadingAuth]);

    useEffect(() => {
        fetchInvoiceServices();
        fetchTreatmentGroups();
    }, [])


    return (
        <div className="flex flex-col h-full">
            <Tabs defaultValue="invoice-services" className="flex-1 flex flex-col">
                <div className="flex-1 overflow-auto">
                    <TabsContent value="invoice-services" className="h-full">
                        <div className="bg-gray-50 p-4 md:p-6 lg:p-8 h-full">
                            <div className="max-w-7xl mx-auto h-full flex flex-col">
                                <div className="md:mb-2 mx-auto md:mx-0">
                                    <h1 className="text-2xl font-bold text-gray-900">Invoice Services</h1>
                                    <p className="text-gray-600">Manage available invoice services</p>
                                </div>

                                <TabsList className="md:mt-2 mb-4 md:my-auto my-4 h-8 mx-auto md:mx-0">
                                    <TabsTrigger value="invoice-services">Invoice Services</TabsTrigger>
                                    <TabsTrigger value="treatment-groups">Treatment Groups</TabsTrigger>
                                </TabsList>

                                <div className="w-full mb-4 md:w-auto md:flex md:justify-end">
                                    <Button
                                        onClick={() => { setShowAddDialog(true) }}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        + Add Invoice Service
                                    </Button>
                                </div>

                                <div className="bg-white rounded-lg shadow overflow-x-auto flex-1">
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block">
                                        <div className="bg-green-50 px-6 py-3 border-b border-green-200">
                                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                                                <div className="col-span-1 text-center">ID</div>
                                                <div className="col-span-2 text-center">Service Name</div>
                                                <div className="col-span-2 text-center">Treatment Group</div>
                                                <div className="col-span-1 text-center">Type</div>
                                                <div className="col-span-2 text-center">Amount</div>
                                                <div className="col-span-1 text-center">Tax (%)</div>
                                                <div className="col-span-2 text-center">Description</div>
                                                <div className="col-span-1 text-center">Actions</div>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-200">
                                            {fetchingData ? (
                                                <div className="px-6 py-12 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                                    <p className="text-gray-500 mt-2">Loading invoice services...</p>
                                                </div>
                                            ) : invoiceServices.length === 0 ? (
                                                <div className="px-6 py-6 text-center text-gray-500">
                                                    No invoice services found.
                                                </div>
                                            ) : (
                                                invoiceServices.map((service) => (
                                                    <div
                                                        key={`desktop-${service.service_id}`}
                                                        className="px-6 py-4 hover:bg-gray-50"
                                                    >
                                                        <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                                            <div className="text-gray-900 col-span-1 text-center">{service.service_id}</div>
                                                            <div className="text-gray-900 col-span-2 text-center">{service.service_name}</div>
                                                            <div className="text-gray-700 col-span-2 text-center">
                                                                {service.treatment?.treatment_group}
                                                            </div>
                                                            <div className="text-gray-700 col-span-1 text-center">{service.treatment_type}</div>
                                                            <div className="text-gray-700 col-span-2 text-center">Rs. {service.amount.toFixed(2)}</div>
                                                            <div className="text-gray-700 col-span-1 text-center">{service.tax_percentage}%</div>
                                                            <div className="text-gray-700 col-span-2 truncate text-center" title={service.description}>
                                                                {service.description || 'N/A'}
                                                            </div>
                                                            <div className="col-span-1 flex justify-center space-x-2 text-center">
                                                                <button
                                                                    onClick={() => handleViewDoctors(service.service_id)}
                                                                    className="text-emerald-600 hover:text-emerald-800 p-1 rounded-full hover:bg-blue-50"
                                                                    title="View Dentists"
                                                                >
                                                                    <Stethoscope className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditInvoiceService(service)}
                                                                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(service.service_id)}
                                                                    className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                                                                    disabled={deletingInvoiceService}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-3 p-3">
                                        {fetchingData ? (
                                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                                <p className="text-gray-500 mt-3 text-sm">Loading services...</p>
                                            </div>
                                        ) : invoiceServices.length === 0 ? (
                                            <div className="text-center p-6 text-gray-500">
                                                No services found
                                            </div>
                                        ) : (
                                            invoiceServices.map((service) => (
                                                <div
                                                    key={`mobile-${service.service_id}`}
                                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                                                >
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900 text-base">{service.service_name}</h3>
                                                                <div className="flex items-center mt-1">
                                                                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                                                                        {service.treatment_type}
                                                                    </span>
                                                                    <span className="ml-2 text-sm text-gray-500">
                                                                        {service.treatment?.treatment_group}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-semibold text-gray-900">Rs. {service.amount.toFixed(2)}</div>
                                                                <div className="text-xs text-gray-500">Tax: {service.tax_percentage}%</div>
                                                            </div>
                                                        </div>

                                                        {service.description && (
                                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2" title={service.description}>
                                                                {service.description}
                                                            </p>
                                                        )}

                                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    onClick={() => handleViewDoctors(service.service_id)}
                                                                    className="p-1.5 text-emerald-500 hover:text-emerald-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="View Dentists"
                                                                >
                                                                    <Stethoscope className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditInvoiceService(service)}
                                                                    className="p-1.5 text-blue-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteClick(service.service_id)}
                                                                className="p-1.5 text-red-500 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                                disabled={deletingInvoiceService}
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <AddInvoiceServiceDialog
                                    open={showAddDialog}
                                    onClose={() => setShowAddDialog(false)}
                                    onSubmit={fetchInvoiceServices}
                                    apiClient={apiClient}
                                    treatmentGroups={treatmentGroups}
                                />
                                <EditInvoiceServiceDialog
                                    open={editDialogOpen}
                                    onClose={() => setEditDialogOpen(false)}
                                    onSubmit={fetchInvoiceServices}
                                    apiClient={apiClient}
                                    service={serviceToEdit}
                                    treatmentGroups={treatmentGroups}
                                />

                                <DentistListDialog
                                    open={showDentistList}
                                    onClose={() => setShowDentistList(false)}
                                    serviceID={selectedServiceID}
                                    apiClient={apiClient}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="treatment-groups" className="h-full">
                        <div className="bg-gray-50 p-4 md:p-6 lg:p-8 h-full">
                            <div className="max-w-7xl mx-auto h-full flex flex-col">
                                <div className="md:mb-2 mx-auto md:mx-0">
                                    <h1 className="text-2xl font-bold text-gray-900">Treatment Groups</h1>
                                    <p className="text-gray-600">Manage available treatment groups</p>
                                </div>

                                <TabsList className="md:mt-2 mb-4 md:my-auto my-4 h-8 mx-auto md:mx-0">
                                    <TabsTrigger value="invoice-services">Invoice Services</TabsTrigger>
                                    <TabsTrigger value="treatment-groups">Treatment Groups</TabsTrigger>
                                </TabsList>

                                <div className="w-full mb-4 md:w-auto md:flex md:justify-end">
                                    <button
                                        onClick={() => setShowAddTreatmentDialog(true)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        + Add Treatment Group
                                    </button>
                                </div>

                                <div className="bg-white rounded-lg shadow overflow-x-auto flex-1">
                                    <div className="bg-green-50 px-6 py-3 border-b border-green-200">
                                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                                            <div className="col-span-1">ID</div>
                                            <div className="col-span-9">Treatment Group</div>
                                            <div className="col-span-2">Actions</div>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-200">
                                        {fetchingData ? (
                                            <div className="px-6 py-12 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                                <p className="text-gray-500 mt-2">Loading treatment groups...</p>
                                            </div>
                                        ) : treatmentGroups.length === 0 ? (
                                            <div className="px-6 py-6 text-center text-gray-500">
                                                No treatment groups found.
                                            </div>
                                        ) : (
                                            treatmentGroups.map((treatment) => (
                                                <div
                                                    key={treatment.no}
                                                    className="px-6 py-4 hover:bg-gray-50"
                                                >
                                                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                                        <div className="text-gray-900 col-span-1">{treatment.no}</div>
                                                        <div className="text-gray-900 col-span-9">{treatment.treatment_group}</div>
                                                        <div className="flex gap-2 col-span-2">
                                                            <button
                                                                onClick={() => { setSelectedTreatment(treatment); setShowEditTreatmentDialog(true); }}
                                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                            >
                                                                <Edit className="h-4" />
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await apiClient.delete(`treatments/${treatment.no}`);
                                                                        toast.success("Deleted treatment");
                                                                        fetchTreatmentGroups();
                                                                    } catch {
                                                                        toast.error("Failed to delete treatment");
                                                                    }
                                                                }}
                                                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                                                            >
                                                                <Trash2 className="h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <AddTreatmentDialog
                                    open={showAddTreatmentDialog}
                                    onClose={() => setShowAddTreatmentDialog(false)}
                                    onSubmit={fetchTreatmentGroups}
                                    apiClient={apiClient}
                                />

                                <EditTreatmentDialog
                                    open={showEditTreatmentDialog}
                                    onClose={() => setShowEditTreatmentDialog(false)}
                                    onSubmit={fetchTreatmentGroups}
                                    apiClient={apiClient}
                                    treatment={selectedTreatment}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Invoice Service</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 p-2 rounded-full bg-red-100 text-red-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">
                                Are you sure you want to delete this invoice service?
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deletingInvoiceService}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteInvoiceService}
                            disabled={deletingInvoiceService}
                        >
                            {deletingInvoiceService ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );

}