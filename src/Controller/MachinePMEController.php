<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class MachinePMEController extends AbstractController
{
    #[Route('/machine_pme', name: 'app_machine_pme')]
    public function index(): Response
    {
        return $this->render('machine_pme/index.html.twig', [
            'controller_name' => 'MachinePMEController',
        ]);
    }
}
