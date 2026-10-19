<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request as HttpFoundationRequest;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HomeController extends AbstractController
{
    #[Route('/', name: 'home')]
    public function index(HttpFoundationRequest $request): Response
    {
        // dd($request);
        return $this->render('home/index.html.twig', [
            'controller_name' => 'HomeController',
        ]);
        //return new Response('deep understanding');
    }
}
