const PartRequestSummary = ({ data }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Part Requests</h3>
            <p>Pending: {data.pending}</p>
            <p>Approved: {data.approved}</p>
            <p>Fulfilled: {data.fulfilled}</p>
        </div>
    );
};

export default PartRequestSummary;
