"use client"
import AddInvoiceServiceDialog from "@/components/AddInvoiceServiceDialog"
import EditInvoiceServiceDialog from "@/components/EditInvoiceServiceDialog"
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs"

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Edit, Eye, Stethoscope, Trash2 } from "lucide-react";
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

    const deleteInvoiceService = async (service_id: number) => {
        setDeletingInvoiceService(true);
        try {
            const res = await apiClient.delete(`invoice-services/${service_id}`);
            if (res.status == 500) {
                throw new Error("Error deleting invoice service");
            }
            toast.success("Invoice service deleted successfully");
            // Refresh the list after deletion
            fetchInvoiceServices();
        }
        catch (err: any) {
            toast.error(err.message);
        }
        finally {
            setDeletingInvoiceService(false);
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
                <TabsList className="md:mt-5 mb-4">
                    <TabsTrigger value="invoice-services">Invoice Services</TabsTrigger>
                    <TabsTrigger value="treatment-groups">Treatment Groups</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto">
                    <TabsContent value="invoice-services" className="h-full">
                        <div className="bg-gray-50 p-4 md:p-6 lg:p-8 h-full">
                            <div className="max-w-7xl mx-auto h-full flex flex-col">
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900">Invoice Services</h1>
                                    <p className="text-gray-600">Manage available invoice services</p>
                                </div>

                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => { setShowAddDialog(true) }}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        + Add Invoice Service
                                    </button>
                                </div>

                                <div className="bg-white rounded-lg shadow overflow-x-auto flex-1">
                                    <div className="bg-green-50 px-6 py-3 border-b border-green-200">
                                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                                            <div className="col-span-1">ID</div>
                                            <div className="col-span-2">Service Name</div>
                                            <div className="col-span-2">Treatment Group</div>
                                            <div className="col-span-1">Type</div>
                                            <div className="col-span-1">Amount</div>
                                            <div className="col-span-1">Tax (%)</div>
                                            <div className="col-span-2">Description</div>
                                            <div className="col-span-2">Actions</div>
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
                                                    key={service.service_id}
                                                    className="px-6 py-4 hover:bg-gray-50"
                                                >
                                                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                                        <div className="text-gray-900 col-span-1">{service.service_id}</div>
                                                        <div className="text-gray-900 col-span-2">{service.service_name}</div>
                                                        <div className="text-gray-700 col-span-2">
                                                            {service.treatment?.treatment_group}
                                                        </div>
                                                        <div className="text-gray-600 col-span-1">{service.treatment_type}</div>
                                                        <div className="text-gray-600 col-span-1">Rs. {service.amount.toFixed(2)}</div>
                                                        <div className="text-gray-600 col-span-1">{service.tax_percentage}%</div>
                                                        <div className="text-gray-600 col-span-2 truncate" title={service.description}>
                                                            {service.description || "N/A"}
                                                        </div>
                                                        <div className="flex gap-2 col-span-2">
                                                            <button
                                                                onClick={() => handleEditInvoiceService(service)}
                                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                            >
                                                                <Edit className="h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteInvoiceService(service.service_id)}
                                                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                                                            >
                                                                <Trash2 className="h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleViewDoctors(service.service_id)}
                                                                className="text-purple-500 hover:text-purple-700 text-xs font-medium"
                                                            >
                                                                <Stethoscope className="h-4" />
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
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900">Treatment Groups</h1>
                                    <p className="text-gray-600">Manage available treatment groups</p>
                                </div>

                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => setShowAddTreatmentDialog(true)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium"
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
        </div>
    );

}