<?php
final readonly class LinearDepreciation{
public function __construct(
  private Money $ValeirResiduelle
)
{
  throw new \Exception('Not implemented');
}
public function depreciationOver(Money $price, int $years):Money{
  //perte= prix-valeur de revente
  return new Money($price->cents-$this->ValeirResiduelle)
  // en vrai: passer par une méthode subtract() de Money
}
}
