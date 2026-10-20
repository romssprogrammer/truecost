<?php
namespace App\Domain\Model;

final readonly class Money{
const FACTOR =100;


  private function __construct(public int $cents){}


  public static function fromCents(int $cents):self{
    return new self($cents);
  }
  
 public static function fromEuros(float|int $euros):self {
  return new self((int) round($euros*self::FACTOR) );
 }


 public static function zero():self{
  return new self(0);
 }

 public function add(Money $value){
  return new self($this->cents+$value->cents);
 }
 
 public function subtract(Money $value):self{
  return new self($this->cents-$value->cents );
 }

 public function multiply($factor):self{

  return new self((int) round($this->cents));
 
}
 

public function equals(Money $value):bool{
  return $this->cents===$value->cents;
}
public function toEuros(): float{
  // uniquement pour l'affichage / le JSON, jamais pour calculer
  return $this->cents/100;
}


 }
