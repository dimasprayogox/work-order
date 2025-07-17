import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Panel } from "primereact/panel";

const AddRequestPage = () => {
    return (
        <Panel header="New Work Request">
            <div className="grid">
                <div className="col-12">
                    <label htmlFor="" className="text-lg">
                        Site
                        <sup className="text-red-300">*</sup>
                    </label>
                    <InputText className="w-full mt-2" />
                </div>
                <div className="col-12">
                    <label htmlFor="" className="text-lg">
                        Description
                        <sup className="text-red-300">*</sup>
                    </label>
                    <InputTextarea rows={10} className="w-full mt-2" />
                </div>
                <div className="col-12">
                    <label htmlFor="" className="text-lg">
                        Assets
                        <sup className="text-red-300">*</sup>
                    </label>
                    <FileUpload className="w-full" style={{ marginTop: "10px" }} emptyTemplate={"Please upload assets file"} />
                </div>
            </div>

            <div className="flex justify-content-end mt-3 gap-3">
                <Button label="Cancel" severity="secondary" size="large" outlined />
                <Button label="Add" severity="success" size="large" outlined />
            </div>
        </Panel>
    );
};

export default AddRequestPage;
