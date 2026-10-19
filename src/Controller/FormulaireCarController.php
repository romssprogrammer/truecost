<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class FormulaireCarController extends AbstractController
{
    #[Route('/formulaire', name: 'app_formulaire_car')]
    public function index(): Response
    {
        return $this->render('formulaire_car/index.html.twig', [
            'controller_name' => 'FormulaireCarController',
        ]);
    }
}
