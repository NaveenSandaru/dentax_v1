"use client"

import AddQuestionDialog from "@/components/AddQuestionDialog";
import EditQuestionDialog from "@/components/EditQuestionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthContext } from "@/context/auth-context"
import { AlertTriangle, Edit, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner";

interface SecurityQuestion {
    security_question_id: number,
    question: string
}

export default function Settings() {

    const [securityQuestions, setSecurityQuestion] = useState<SecurityQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<SecurityQuestion>();
    const [deletingQuestionID, setDeletingQuestionID] = useState(0);

    const [fetchingData, setFetchingData] = useState(false);
    const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
    const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false);
    const [isDeletingQuestion, setIsDeletingQUestion] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { apiClient, user, isLoadingAuth, isLoggedIn } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (isLoadingAuth) return;
        if (!isLoggedIn) {
            toast.error("Please Log in");
            router.push("/login");
        }
        else if (user.role != "admin") {
            toast.error("Access Denied");
            router.push("/login");
        }
    }, [isLoadingAuth]);

    const fetchQuestions = async () => {
        setFetchingData(true);
        try {
            const res = await apiClient.get(`security-questions`);
            if (res.status == 500) {
                throw new Error("Error Fetching Security Questions");
            }
            setSecurityQuestion(res.data);
        }
        catch (err: any) {
            toast.error(err.message);
        }
        finally {
            setFetchingData(false);
        }
    };

    const handleDeleteQuestionClick = async (questionID: number) => {
        setDeletingQuestionID(questionID);
        setDeleteDialogOpen(true);

    };

    const confirmDeleteQuestion = async () => {
        setIsDeletingQUestion(true);
        try {
            const res = await apiClient.delete(`security-questions/${deletingQuestionID}`);
            if (res.status == 500) {
                throw new Error("Error Deleting Question");
            }
            fetchQuestions();
        }
        catch (err: any) {
            toast.error(err.message);
        }
        finally {
            setIsDeletingQUestion(false);
            setDeleteDialogOpen(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    return (
        <Tabs defaultValue="security-questions" className="flex-1 flex flex-col">
            <TabsList className="w-full">
                <TabsTrigger value="security-questions">Security Questions</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-auto">
                <TabsContent value="security-questions" className="h-full">
                    <div className="bg-gray-50 p-4 md:p-6 lg:p-8 h-full">
                        <div className="max-w-7xl mx-auto h-full flex flex-col">
                            <div className="md:mb-2 mx-auto md:mx-0">
                                <h1 className="text-2xl font-bold text-gray-900">Security Question</h1>
                                <p className="text-gray-600">Manage available security question</p>
                            </div>

                            <div className="w-full mb-4 pt-4 md:pt-0 md:w-auto md:flex md:justify-end">
                                <button
                                    onClick={() => setShowAddQuestionDialog(true)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    + Add Security Question
                                </button>
                            </div>

                            <div className="bg-white rounded-lg shadow overflow-x-auto flex-1">
                                <div className="bg-green-50 px-6 py-3 border-b border-green-200">
                                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                                        <div className="col-span-1 text-center">ID</div>
                                        <div className="col-span-8 text-center">Security Question</div>
                                        <div className="col-span-3 text-center">Actions</div>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {fetchingData ? (
                                        <div className="px-6 py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                            <p className="text-gray-500 mt-2">Loading Security Questions...</p>
                                        </div>
                                    ) : securityQuestions.length === 0 ? (
                                        <div className="px-6 py-6 text-center text-gray-500">
                                            No security questions found.
                                        </div>
                                    ) : (
                                        securityQuestions.map((question) => (
                                            <div
                                                key={question.security_question_id}
                                                className="px-6 py-4 hover:bg-gray-50"
                                            >
                                                <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                                    <div className="text-gray-900 col-span-1 text-center">{question.security_question_id}</div>
                                                    <div className="text-gray-900 col-span-8 text-center">{question.question}</div>
                                                    <div className="flex gap-2 col-span-3 justify-center">
                                                        <button
                                                            onClick={() => { setSelectedQuestion(question); setShowEditQuestionDialog(true); }}
                                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                            title="Edit Security Question"
                                                        >
                                                            <Edit className="h-4" />
                                                        </button>
                                                        <button
                                                            disabled={isDeletingQuestion && question.security_question_id == deletingQuestionID}
                                                            onClick={() => { handleDeleteQuestionClick(question.security_question_id); }}
                                                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                                                            title="Delete Security Question"
                                                        >
                                                            {isDeletingQuestion && question.security_question_id == deletingQuestionID ? <Loader2 className="h-4" /> : <Trash2 className="h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <AddQuestionDialog
                                open={showAddQuestionDialog}
                                onClose={() => setShowAddQuestionDialog(false)}
                                onSubmit={fetchQuestions}
                                apiClient={apiClient}
                            />

                            <EditQuestionDialog
                                open={showEditQuestionDialog}
                                onClose={() => setShowEditQuestionDialog(false)}
                                onSubmit={fetchQuestions}
                                apiClient={apiClient}
                                question={selectedQuestion}
                            />

                            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Delete Security Question</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 p-2 rounded-full bg-red-100 text-red-600">
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Are you sure you want to delete this security question?
                                                This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 mt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setDeleteDialogOpen(false)}
                                            disabled={isDeletingQuestion}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={confirmDeleteQuestion}
                                            disabled={isDeletingQuestion}
                                        >
                                            {isDeletingQuestion ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </TabsContent>
            </div>
        </Tabs>
    )
}