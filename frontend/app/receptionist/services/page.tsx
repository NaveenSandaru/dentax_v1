"use client"

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
import { Stethoscope } from "lucide-react";
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
}

export default function InvoiceServicePage() {

    const router = useRouter();

    const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);

    const [invoiceServices, setInvoiceServices] = useState<InvoiceService[]>([]);
    const [treatmentGroups, setTreatmentGroups] = useState<Treatment[]>([]);

    const [selectedServiceID, setSelectedServiceID] = useState<number>(0);

    const [fetchingData, setFetchingData] = useState(false);
    const [showDentistList, setShowDentistList] = useState(false);

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

    const handleViewDoctors = (serviceID: number) => {
        setSelectedServiceID(serviceID);
        setShowDentistList(true);
    };

    useEffect(() => {
        if (isLoadingAuth) return;
        if (!isLoggedIn) {
            toast.error("Please log in");
            router.push("/login");
        }
        else if (user.role != "receptionist") {
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
                <TabsList className="md: mt-5 mb-4">
                    <TabsTrigger value="invoice-services">Invoice Services</TabsTrigger>
                    <TabsTrigger value="treatment-groups">Treatment Groups</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto">
                    <TabsContent value="invoice-services" className="h-full">
                        <div className="bg-gray-50 p-4 md:p-6 lg:p-8 h-full">
                            <div className="max-w-7xl mx-auto h-full flex flex-col">
                                {/* Header */}
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900">Invoice Services</h1>
                                    <p className="text-gray-600">Manage available invoice services</p>
                                </div>

                                {/* Table Container */}
                                <div className="bg-white rounded-xl shadow-md overflow-hidden flex-1 border border-gray-200">
                                    {/* Table Header */}
                                    <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-200">
                                        <div className="grid grid-cols-[60px_1.5fr_1.5fr_100px_100px_80px_minmax(150px,1fr)_120px] gap-4 text-sm font-semibold text-emerald-800">
                                            <div>ID</div>
                                            <div>Service Name</div>
                                            <div>Treatment Group</div>
                                            <div>Type</div>
                                            <div>Amount</div>
                                            <div>Tax (%)</div>
                                            <div>Description</div>
                                            <div>Actions</div>
                                        </div>
                                    </div>

                                    {/* Table Body */}
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
                                            invoiceServices.map((service, index) => (
                                                <div
                                                    key={service.service_id}
                                                    className={`px-6 py-4 grid grid-cols-[60px_1.5fr_1.5fr_100px_100px_80px_minmax(150px,1fr)_120px] gap-4 items-center text-sm ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="text-gray-900 font-medium">{service.service_id}</div>
                                                    <div className="text-gray-900">{service.service_name}</div>
                                                    <div className="text-gray-700">{service.treatment?.treatment_group}</div>
                                                    <div className="text-gray-600">{service.treatment_type}</div>
                                                    <div className="text-gray-600">Rs. {service.amount.toFixed(2)}</div>
                                                    <div className="text-gray-600">{service.tax_percentage}%</div>
                                                    <div className="text-gray-600 truncate" title={service.description}>
                                                        {service.description || "N/A"}
                                                    </div>
                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleViewDoctors(service.service_id)}
                                                            className="text-purple-500 hover:text-purple-700 text-xs font-medium"
                                                        >
                                                            <Stethoscope className="h-4" />
                                                        </button>

                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DentistListDialog
                            open={showDentistList}
                            onClose={() => setShowDentistList(false)}
                            serviceID={selectedServiceID}
                            apiClient={apiClient}
                        />
                    </TabsContent>


                    <TabsContent value="treatment-groups" className="h-full">
                        <div className="bg-gray-50 p-4 md:p-6 lg:p-8 h-full">
                            <div className="max-w-7xl mx-auto h-full flex flex-col">
                                {/* Header */}
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900">Treatment Groups</h1>
                                    <p className="text-gray-600">Manage available treatment groups</p>
                                </div>

                                {/* Grid Container */}
                                {fetchingData ? (
                                    <div className="flex flex-1 justify-center items-center flex-col">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                        <p className="text-gray-500 mt-2">Loading treatment groups...</p>
                                    </div>
                                ) : treatmentGroups.length === 0 ? (
                                    <div className="flex flex-1 justify-center items-center text-gray-500">
                                        No treatment groups found.
                                    </div>
                                ) : (
                                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                        {treatmentGroups.map((treatment) => (
                                            <div
                                                key={treatment.no}
                                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                                            >
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">ID:</span> {treatment.no}
                                                </p>
                                                <p className="text-sm text-gray-700 mt-1">
                                                    <span className="font-semibold">Name:</span> {treatment.treatment_group}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );

}