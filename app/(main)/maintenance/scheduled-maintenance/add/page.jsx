import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

const AddWorkOrderPage = () => {
    return (
        <div>
            <div className="card">
                <h4>Work Order Administration: WO 28</h4>

                <div className="grid">
                    <div className="col-12 md:col-4">
                        <div className="flex align-items-center justify-content-center" style={{ minHeight: "100%" }}>
                            <div className="col">
                                <img src="/blank-image.png" alt="" width={100} />
                            </div>
                            <div className="col">
                                <p className="p-0 m-0">Code</p>
                                <p className="p-0 m-0">28</p>
                                <img src="/qr-example.png" alt="" width={100} />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 md:col-8">
                        <div className="grid">
                            <div className="col-12 md:col-4">
                                <div className="mt-3">
                                    <label htmlFor="">Work Order Status</label>
                                    <Dropdown className="w-full mt-2" />
                                </div>
                                <div className="mt-3">
                                    <label htmlFor="">Maintenance Type</label>
                                    <Dropdown className="w-full mt-2" />
                                </div>
                                <div className="mt-3">
                                    <label htmlFor="">Priority</label>
                                    <Dropdown className="w-full mt-2" />
                                </div>
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="mt-3">
                                    <label htmlFor="">Asset</label>
                                    <Dropdown className="w-full mt-2" />
                                </div>
                                <div className="mt-3">
                                    <label htmlFor="">Project</label>
                                    <Dropdown className="w-full mt-2" />
                                </div>
                                <div className="mt-3">
                                    <label htmlFor="">Suggested Start Date</label>
                                    <Dropdown className="w-full mt-2" />
                                </div>
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="mt-3">
                                    <label htmlFor="">Suggested Completion Date</label>
                                    <Dropdown className="w-full mt-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="grid">
                    <div className="col-12">
                        <div>
                            <label htmlFor="">Summary of Issue</label>
                            <InputTextarea rows={3} className="w-full mt-3" />
                        </div>
                    </div>
                    <div className="col-12">
                        <div>
                            <label className="block" htmlFor="">
                                Problem Code
                            </label>
                            <Dropdown className="mt-3 w-full" />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div>
                            <label className="block" htmlFor="">
                                Work Instructions
                            </label>
                            <InputTextarea rows={10} className="w-full mt-1" />
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="mb-3">
                            <label className="block" htmlFor="">
                                Assigned To User
                            </label>
                            <Dropdown className="w-full mt-1" />
                        </div>
                        <div className="mb-3">
                            <label className="block" htmlFor="">
                                Estimated Labor
                            </label>
                            <div className="p-inputgroup mt-1">
                                <InputText className="w-full" />
                                <div className="p-inputgroup-addon">hours</div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="block" htmlFor="">
                                Completed By User
                            </label>
                            <Dropdown className="w-full mt-1" />
                        </div>
                        <div className="mb-3">
                            <label className="block" htmlFor="">
                                Actual Labor
                            </label>
                            <div className="p-inputgroup mt-1">
                                <InputText className="w-full" />
                                <div className="p-inputgroup-addon">hours</div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="block" htmlFor="">
                                Date Completed
                            </label>

                            <Calendar className="w-full mt-1" showIcon />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddWorkOrderPage;
