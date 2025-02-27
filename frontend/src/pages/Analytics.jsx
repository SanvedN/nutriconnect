import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from '../contexts/UserContext'
import NutritionGraphs from '../components/NutritionGraphs'

export default function Analytics() {
  const { user } = useUser()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Nutrition Analytics</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Nutritional Overview</CardTitle>
          <CardDescription>Comprehensive analysis of your nutritional intake</CardDescription>
        </CardHeader>
        <CardContent>
          <NutritionGraphs />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Daily Average</CardTitle>
            <CardDescription>Your average daily nutritional intake</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Calories</dt>
                <dd className="text-lg font-semibold">2200 kcal</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Protein</dt>
                <dd className="text-lg font-semibold">110g</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Carbs</dt>
                <dd className="text-lg font-semibold">260g</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fat</dt>
                <dd className="text-lg font-semibold">75g</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
            <CardDescription>Your progress towards nutritional goals</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex items-center">
                <dt className="text-sm font-medium text-gray-500 w-1/2">Calorie Goal:</dt>
                <dd className="text-sm font-semibold w-1/2">90% achieved</dd>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <div className="flex items-center">
                <dt className="text-sm font-medium text-gray-500 w-1/2">Protein Goal:</dt>
                <dd className="text-sm font-semibold w-1/2">85% achieved</dd>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Personalized nutrition advice</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Increase your protein intake by 10g per day</li>
              <li>Add more leafy greens to boost micronutrients</li>
              <li>Consider reducing saturated fat consumption</li>
              <li>Stay hydrated: aim for 8 glasses of water daily</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}