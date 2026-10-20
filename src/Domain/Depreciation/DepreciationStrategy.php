<?php
interface DepreciationStrategyInterface {
public function depreciation(Money $price,int $years):Money;
}

