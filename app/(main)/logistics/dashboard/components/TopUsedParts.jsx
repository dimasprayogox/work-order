const TopUsedParts = ({ data }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Top Used Parts</h3>
            <ul>
                {data.map((item) => (
                    <li key={item.part_id}>
                        {item.part?.name || "Unknown"} - {item.total_used} used
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TopUsedParts;
