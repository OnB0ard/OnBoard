const PlanAddCard = ({ onClick }) => (
  <div
    className="
      bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center
      w-full max-w-[280px] h-[390px] cursor-pointer transition-all duration-200
      hover:shadow-lg hover:-translate-y-1 hover:border hover:border-gray-200
      text-gray-400 select-none
    "
    onClick={onClick}
  >
    <span className="text-6xl font-light">+</span>
  </div>
);

export default PlanAddCard;