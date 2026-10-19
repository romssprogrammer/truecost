import { currencyTYpe } from "../../../src/utils/formatPrice";

export default function HeaderTrueCost({ currencyValue, onCurrencyChange }) {
    return (
        <header class="flex justify-between items-center border-b border-blue-200 pt-[28px] pb-[28px] pl-[40px] pr-[40px] ">
            <div class="flex items-center gap-[10px]  ">
                <div class=" flex items-center w-[30px] h-[30px] border rounded-[7px] bg-linear-to-r from-cyan-500 to-blue-500 justify-center text-white font-[Newsreader] italic font-semibold text-[18px] font-serif">
                    T
                </div>
                <div className="flex flex-row">
                    <div>
                        <h1 class="text-xl italic">TrueCost</h1>
                        <div class="text-[12.5px] text-[#767267]">
                            Le coût réel de vos décisions
                        </div>
                    </div>
                    <div>
                        <label htmlFor="">Currency</label>
                        <select
                            className="ml-2"
                            value={currencyValue}
                            onChange={onCurrencyChange}
                        >
                            <option value={currencyTYpe.USD}>USD</option>
                            <option value={currencyTYpe.EUR}>EUR</option>
                            <option value={currencyTYpe.GBP}>GBP</option>
                            <option value={currencyTYpe.JPY}>JPY</option>
                        </select>
                    </div>
                </div>
            </div>
        </header>
    );
}
