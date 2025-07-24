const PartSummary = ({ data }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Part Summary</h3>
            <p>Total Parts: {data.total_parts}</p>
            <p>Low Stock: {data.low_stock}</p>
        </div>
    );
};

export default PartSummary;
